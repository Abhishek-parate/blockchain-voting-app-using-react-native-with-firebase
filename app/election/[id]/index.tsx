import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { Text, Card, Button, useTheme, Divider } from '@rneui/themed';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../contexts/AuthContext';
import { getElectionById, castVote } from '../../../utils/firebase';
import { recordVoteOnBlockchain, createVoteHash } from '../../../utils/blockchain';

// Types
interface Candidate {
  id: number;
  name: string;
  info: string;
  voteCount: number;
}

interface Election {
  id: string;
  title: string;
  description: string;
  startDate: any;
  endDate: any;
  candidates: any; // Can handle both array and object formats
  voters: string[];
  isActive: boolean;
}

export default function VotingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme } = useTheme();
  const { user, userProfile } = useAuth();
  const [election, setElection] = useState<Election | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  
  const isAdmin = userProfile?.isAdmin === true;
  
  useEffect(() => {
    fetchElection();
  }, [id]);
  
  const fetchElection = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const { election: fetchedElection, error } = await getElectionById(id as string);
      if (fetchedElection && !error) {
        setElection(fetchedElection as unknown as Election);
        
        // Process candidates data
        const processedCandidates = processCandidates(fetchedElection.candidates);
        setCandidates(processedCandidates);
      } else {
        Alert.alert('Error', error || 'Could not fetch election details');
      }
    } catch (error) {
      console.error('Error fetching election:', error);
      Alert.alert('Error', 'Failed to load election details');
    } finally {
      setLoading(false);
    }
  };
  
  // Process candidates from either array or object format
  const processCandidates = (candidatesData: any): Candidate[] => {
    if (!candidatesData) {
      console.error("No candidates data available");
      return [];
    }
    
    // Check if candidates is an array
    if (Array.isArray(candidatesData)) {
      return candidatesData;
    }
    
    // Handle object format with numeric keys
    if (typeof candidatesData === 'object') {
      try {
        const candidateArray: Candidate[] = [];
        Object.keys(candidatesData).forEach(key => {
          const candidateId = parseInt(key) + 1; // Convert to 1-based index if needed
          const candidateData = candidatesData[key];
          
          candidateArray.push({
            id: candidateId,
            name: candidateData.name || `Candidate ${candidateId}`,
            info: candidateData.info || '',
            voteCount: candidateData.voteCount || 0
          });
        });
        return candidateArray;
      } catch (error) {
        console.error("Error processing candidates data:", error);
        return [];
      }
    }
    
    console.error("Invalid candidates data:", candidatesData);
    return [];
  };
  
  const handleCandidateSelection = (candidateId: number) => {
    console.log('Selecting candidate:', candidateId);
    setSelectedCandidate(candidateId);
  };
  
  const handleVote = async () => {
    if (!election || !user || selectedCandidate === null) return;
    
    setSubmitting(true);
    try {
      // Check if user already voted
      if (election.voters.includes(user.uid)) {
        Alert.alert('Already Voted', 'You have already cast your vote in this election');
        router.push(`/election/${election.id}/results`);
        return;
      }
      
      // Check if election is active
      if (!election.isActive) {
        Alert.alert('Election Inactive', 'This election is not currently active');
        return;
      }
      
      // Check if election has ended
      const now = new Date();
      const endDate = election.endDate.toDate();
      if (endDate < now) {
        Alert.alert('Election Ended', 'This election has already ended');
        return;
      }
      
      // Create vote hash
      const voteHash = createVoteHash(election.id, selectedCandidate, user.uid);
      
      // Record vote on blockchain
      const blockchainResult = await recordVoteOnBlockchain(
        election.id,
        selectedCandidate,
        user.uid
      );
      
      if (!blockchainResult.success) {
        Alert.alert('Blockchain Error', blockchainResult.error || 'Failed to record vote on blockchain');
        return;
      }
      
      // Cast vote in database
      const voteResult = await castVote(
        election.id,
        selectedCandidate,
        user.uid,
        voteHash
      );
      
      if (voteResult.error) {
        Alert.alert('Vote Error', voteResult.error);
        return;
      }
      
      Alert.alert(
        'Vote Cast Successfully',
        'Your vote has been securely recorded on the blockchain',
        [
          {
            text: 'View Results',
            onPress: () => router.push(`/election/${election.id}/results`)
          }
        ]
      );
      
    } catch (error: any) {
      console.error('Error casting vote:', error);
      Alert.alert('Error', error.message || 'Failed to cast vote');
    } finally {
      setSubmitting(false);
    }
  };
  
  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ marginTop: 20 }}>Loading election details...</Text>
      </View>
    );
  }
  
  if (!election) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Ionicons name="alert-circle-outline" size={50} color={theme.colors.error} />
        <Text style={{ marginTop: 20, fontSize: 18 }}>Election not found</Text>
        <Button
          title="Go Back"
          type="outline"
          containerStyle={{ marginTop: 20 }}
          onPress={() => router.back()}
        />
      </View>
    );
  }
  
  const hasVoted = user ? election.voters.includes(user.uid) : false;
  const now = new Date();
  const endDate = election.endDate.toDate();
  const isEnded = endDate < now;
  
  // Check if user has already voted or if election has ended (for non-admin users)
  if ((hasVoted || isEnded) && !isAdmin) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.centerContent}>
          {hasVoted ? (
            <>
              <Ionicons name="checkmark-circle" size={80} color={theme.colors.success} />
              <Text h4 style={{ marginTop: 20, textAlign: 'center' }}>You've Already Voted</Text>
              <Text style={{ marginTop: 10, textAlign: 'center', color: theme.colors.grey4 }}>
                Your vote has been recorded for this election.
              </Text>
            </>
          ) : (
            <>
              <Ionicons name="time" size={80} color={theme.colors.warning} />
              <Text h4 style={{ marginTop: 20, textAlign: 'center' }}>Election Has Ended</Text>
              <Text style={{ marginTop: 10, textAlign: 'center', color: theme.colors.grey4 }}>
                This election is no longer accepting votes.
              </Text>
            </>
          )}
          
          <Button
            title="View Results"
            buttonStyle={{ backgroundColor: theme.colors.primary }}
            containerStyle={{ marginTop: 30, width: 200 }}
            icon={
              <Ionicons
                name="stats-chart-outline"
                size={20}
                color="white"
                style={{ marginRight: 10 }}
              />
            }
            onPress={() => router.push(`/election/${election.id}/results`)}
          />
          
          <Button
            title="Back to Elections"
            type="outline"
            buttonStyle={{ borderColor: theme.colors.grey3 }}
            titleStyle={{ color: theme.colors.grey3 }}
            containerStyle={{ marginTop: 15, width: 200 }}
            onPress={() => router.push('/(tabs)/elections')}
          />
        </View>
      </View>
    );
  }
  
  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Card containerStyle={styles.headerCard}>
        <Card.Title style={styles.title}>{election.title}</Card.Title>
        <Card.Divider />
        <Text style={styles.description}>{election.description}</Text>
        
        <View style={styles.electionDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={18} color={theme.colors.grey4} />
            <Text style={styles.detailText}>
              Start: {election.startDate.toDate().toLocaleDateString()}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="time-outline" size={18} color={theme.colors.grey4} />
            <Text style={styles.detailText}>
              End: {election.endDate.toDate().toLocaleDateString()}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons
              name={election.isActive ? "checkmark-circle-outline" : "close-circle-outline"}
              size={18}
              color={election.isActive ? theme.colors.success : theme.colors.error}
            />
            <Text
              style={[
                styles.detailText,
                {
                  color: election.isActive
                    ? theme.colors.success
                    : theme.colors.error,
                },
              ]}
            >
              {election.isActive ? "Active" : "Inactive"}
            </Text>
          </View>
        </View>
      </Card>
      
      <View style={styles.sectionHeader}>
        <Text h4>Select a Candidate</Text>
        <Text style={styles.subText}>
          {isAdmin 
            ? "Admin View: You can review candidates but not vote" 
            : "Tap on a candidate to select them"}
        </Text>
      </View>
      
      {candidates.map((candidate) => (
        <TouchableOpacity 
          key={candidate.id} 
          onPress={() => !isAdmin && handleCandidateSelection(candidate.id)}
          activeOpacity={isAdmin ? 1 : 0.7}
          disabled={isAdmin}
        >
          <Card
            containerStyle={[
              styles.candidateCard,
              selectedCandidate === candidate.id ? {
                borderColor: theme.colors.primary,
                borderWidth: 2,
              } : {}
            ]}
          >
            <View style={styles.candidateHeader}>
              <View style={styles.candidateInfo}>
                <Text style={styles.candidateName}>{candidate.name}</Text>
                {selectedCandidate === candidate.id && (
                  <Ionicons
                    name="checkmark-circle"
                    size={24}
                    color={theme.colors.primary}
                    style={{ marginLeft: 10 }}
                  />
                )}
              </View>
              <View
                style={[
                  styles.candidateId,
                  { backgroundColor: theme.colors.primaryLight || '#e6f2ff' },
                ]}
              >
                <Text style={{ color: theme.colors.primary, fontWeight: 'bold' }}>
                  #{candidate.id}
                </Text>
              </View>
            </View>
            
            <Divider style={{ marginVertical: 10 }} />
            
            <Text style={styles.candidateDescription}>{candidate.info}</Text>
          </Card>
        </TouchableOpacity>
      ))}
      
      {!isAdmin && (
        <View style={styles.actionContainer}>
          <Button
            title="Cast Your Vote"
            disabled={selectedCandidate === null || submitting}
            loading={submitting}
            buttonStyle={[
              styles.voteButton,
              { backgroundColor: theme.colors.primary },
            ]}
            icon={
              <Ionicons
                name="checkbox-outline"
                size={20}
                color="white"
                style={{ marginRight: 10 }}
              />
            }
            onPress={handleVote}
          />
          
          <Text style={styles.disclaimerText}>
            Note: Once cast, your vote cannot be changed
          </Text>
        </View>
      )}
      
      {isAdmin && (
        <View style={styles.adminActions}>
          <Button
            title="View Results"
            buttonStyle={{ backgroundColor: theme.colors.secondary }}
            containerStyle={{ marginBottom: 10 }}
            icon={
              <Ionicons
                name="stats-chart-outline"
                size={20}
                color="white"
                style={{ marginRight: 10 }}
              />
            }
            onPress={() => router.push(`/election/${election.id}/results`)}
          />
          
          <Button
            title="Back to Elections"
            type="outline"
            buttonStyle={{ borderColor: theme.colors.grey3 }}
            titleStyle={{ color: theme.colors.grey3 }}
            icon={
              <Ionicons
                name="arrow-back-outline"
                size={20}
                color={theme.colors.grey3}
                style={{ marginRight: 10 }}
              />
            }
            onPress={() => router.push('/(tabs)/elections')}
          />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 50,
  },
  headerCard: {
    borderRadius: 15,
    marginTop: 15,
    marginBottom: 5,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  title: {
    fontSize: 22,
    textAlign: 'left',
  },
  description: {
    marginBottom: 15,
  },
  electionDetails: {
    marginVertical: 10,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    marginLeft: 10,
    fontSize: 14,
  },
  sectionHeader: {
    padding: 15,
    paddingBottom: 5,
  },
  subText: {
    color: '#8F9BB3',
    marginTop: 5,
  },
  candidateCard: {
    borderRadius: 15,
    marginVertical: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  candidateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  candidateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  candidateName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  candidateId: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  candidateDescription: {
    lineHeight: 20,
  },
  actionContainer: {
    padding: 20,
    marginBottom: 30,
  },
  voteButton: {
    borderRadius: 10,
    paddingVertical: 15,
  },
  disclaimerText: {
    textAlign: 'center',
    marginTop: 15,
    color: '#8F9BB3',
    fontStyle: 'italic',
  },
  adminActions: {
    padding: 20,
    marginBottom: 30,
  },
});