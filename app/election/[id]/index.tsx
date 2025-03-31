// app/election/[id]/index.tsx

import React, { useEffect, useState } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert, 
  ActivityIndicator,
  Platform
} from 'react-native';
import { Text, Card, Button, useTheme, Divider, Chip } from '@rneui/themed';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../contexts/AuthContext';
import { getElectionById, castVote } from '../../../utils/firebase';
import { recordVoteOnBlockchain, createVoteHash } from '../../../utils/blockchain';
import * as Haptics from 'expo-haptics';

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
  candidates: Candidate[];
  voters: string[];
  isActive: boolean;
}

export default function VotingScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { id: electionId } = useLocalSearchParams<{ id: string }>();
  const [election, setElection] = useState<Election | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCandidate, setSelectedCandidate] = useState<number | null>(null);
  const [votingInProgress, setVotingInProgress] = useState(false);

  useEffect(() => {
    const fetchElection = async () => {
      if (electionId) {
        try {
          const { election: fetchedElection, error } = await getElectionById(electionId);
          if (fetchedElection && !error) {
            setElection(fetchedElection as Election);
            
            // Check if user has already voted
            if (fetchedElection.voters.includes(user?.uid || '')) {
              Alert.alert(
                'Already Voted',
                'You have already cast your vote in this election.',
                [
                  {
                    text: 'View Results',
                    onPress: () => router.replace(`/election/${electionId}/results`),
                  },
                  {
                    text: 'Go Back',
                    onPress: () => router.back(),
                    style: 'cancel',
                  },
                ]
              );
            }
          } else {
            Alert.alert('Error', error || 'Could not fetch election details');
            router.back();
          }
        } catch (error) {
          console.error('Error fetching election:', error);
          Alert.alert('Error', 'An error occurred while fetching election details');
          router.back();
        } finally {
          setLoading(false);
        }
      }
    };

    fetchElection();
  }, [electionId, user]);

  const handleSelectCandidate = (candidateId: number) => {
    if (Platform.OS === 'ios') {
      Haptics.selectionAsync();
    }
    setSelectedCandidate(candidateId);
  };

  const handleCastVote = async () => {
    if (!selectedCandidate || !election || !user) {
      Alert.alert('Error', 'Please select a candidate before voting');
      return;
    }

    setVotingInProgress(true);

    try {
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      
      // Create a vote hash for the blockchain
      const voteHash = createVoteHash(electionId!, selectedCandidate, user.uid);
      
      // Record the vote on the blockchain
      const blockchainResult = await recordVoteOnBlockchain(
        electionId!,
        selectedCandidate,
        user.uid
      );
      
      if (!blockchainResult.success) {
        throw new Error(blockchainResult.error || 'Failed to record vote on blockchain');
      }
      
      // Update the vote in Firebase
      const result = await castVote(
        electionId!,
        selectedCandidate,
        user.uid,
        voteHash
      );
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      // Show success message and navigate to results
      Alert.alert(
        'Vote Cast Successfully',
        'Your vote has been securely recorded on the blockchain.',
        [
          {
            text: 'View Results',
            onPress: () => router.replace(`/election/${electionId}/results`),
          },
        ]
      );
    } catch (error: any) {
      console.error('Error casting vote:', error);
      Alert.alert('Error', error.message || 'An error occurred while casting your vote');
    } finally {
      setVotingInProgress(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ marginTop: 20, color: theme.colors.grey4 }}>
          Loading election details...
        </Text>
      </View>
    );
  }

  if (!election) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: theme.colors.background }]}>
        <Ionicons name="alert-circle-outline" size={50} color={theme.colors.error} />
        <Text style={{ marginTop: 20, color: theme.colors.grey4 }}>
          Election not found or could not be loaded
        </Text>
        <Button
          title="Go Back"
          buttonStyle={{ backgroundColor: theme.colors.primary }}
          containerStyle={{ marginTop: 20 }}
          onPress={() => router.back()}
        />
      </View>
    );
  }

  // Check if the election is active and not ended
  const now = new Date();
  const startDate = election.startDate.toDate();
  const endDate = election.endDate.toDate();
  const isActive = election.isActive && startDate <= now && endDate >= now;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={theme.colors.black} />
          </TouchableOpacity>
        </View>

        <View style={styles.electionInfo}>
          <Text h3 style={{ color: theme.colors.black }}>
            {election.title}
          </Text>

          <View style={styles.statusContainer}>
            {isActive ? (
              <Chip
                title="Active"
                icon={{
                  name: 'check-circle',
                  type: 'font-awesome',
                  size: 16,
                  color: 'white',
                }}
                containerStyle={{ marginVertical: 10 }}
                buttonStyle={{ backgroundColor: theme.colors.success }}
              />
            ) : (
              <Chip
                title="Inactive"
                icon={{
                  name: 'times-circle',
                  type: 'font-awesome',
                  size: 16,
                  color: 'white',
                }}
                containerStyle={{ marginVertical: 10 }}
                buttonStyle={{ backgroundColor: theme.colors.error }}
              />
            )}
          </View>

          <Text style={styles.description}>{election.description}</Text>

          <View style={styles.dateInfo}>
            <View style={styles.dateItem}>
              <Ionicons name="calendar-outline" size={16} color={theme.colors.grey4} />
              <Text style={styles.dateText}>
                Start: {startDate.toLocaleDateString()} {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
            <View style={styles.dateItem}>
              <Ionicons name="time-outline" size={16} color={theme.colors.grey4} />
              <Text style={styles.dateText}>
                End: {endDate.toLocaleDateString()} {endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          </View>
        </View>

        <Divider style={{ marginVertical: 20 }} />

        <Text h4 style={styles.sectionTitle}>Select a Candidate</Text>

        {!isActive && (
          <View style={[styles.inactiveWarning, { backgroundColor: theme.colors.error }]}>
            <Ionicons name="warning-outline" size={22} color="white" />
            <Text style={styles.inactiveWarningText}>
              This election is not currently active. Voting is not possible.
            </Text>
          </View>
        )}

        {election.candidates.map((candidate) => (
          <Card
            key={candidate.id}
            containerStyle={[
              styles.candidateCard,
              selectedCandidate === candidate.id && {
                borderColor: theme.colors.primary,
                borderWidth: 2,
              },
              { backgroundColor: theme.colors.white }
            ]}
          >
            <TouchableOpacity
              disabled={!isActive || election.voters.includes(user?.uid || '')}
              onPress={() => handleSelectCandidate(candidate.id)}
              style={styles.candidateContent}
            >
              <View style={styles.candidateHeader}>
                <View style={styles.candidateNameContainer}>
                  {selectedCandidate === candidate.id ? (
                    <Ionicons name="checkmark-circle" size={28} color={theme.colors.primary} />
                  ) : (
                    <Ionicons name="radio-button-off" size={28} color={theme.colors.grey3} />
                  )}
                  <Text h4 style={styles.candidateName}>
                    {candidate.name}
                  </Text>
                </View>
              </View>
              <Text style={styles.candidateInfo}>{candidate.info}</Text>
            </TouchableOpacity>
          </Card>
        ))}

        <View style={styles.voteButtonContainer}>
          <Button
            title="Cast Your Vote"
            onPress={handleCastVote}
            disabled={
              !isActive ||
              selectedCandidate === null ||
              election.voters.includes(user?.uid || '') ||
              votingInProgress
            }
            loading={votingInProgress}
            icon={
              <Ionicons
                name="checkmark-circle-outline"
                size={22}
                color="white"
                style={{ marginRight: 10 }}
              />
            }
            buttonStyle={[
              styles.voteButton,
              {
                backgroundColor:
                  !isActive || election.voters.includes(user?.uid || '')
                    ? theme.colors.grey3
                    : theme.colors.primary,
              },
            ]}
          />
          
          {election.voters.includes(user?.uid || '') && (
            <Button
              title="View Results"
              onPress={() => router.push(`/election/${electionId}/results`)}
              buttonStyle={[
                styles.resultsButton,
                { backgroundColor: theme.colors.secondary },
              ]}
              icon={
                <Ionicons
                  name="stats-chart-outline"
                  size={22}
                  color="white"
                  style={{ marginRight: 10 }}
                />
              }
              containerStyle={{ marginTop: 15 }}
            />
          )}
        </View>

        <View style={styles.securityInfo}>
          <View style={styles.securityItem}>
            <Ionicons name="shield-checkmark-outline" size={24} color={theme.colors.success} />
            <Text style={styles.securityText}>
              Your vote is secure and anonymous on the blockchain
            </Text>
          </View>
          <View style={styles.securityItem}>
            <Ionicons name="lock-closed-outline" size={24} color={theme.colors.primary} />
            <Text style={styles.securityText}>
              Once cast, your vote cannot be changed
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  electionInfo: {
    marginTop: 10,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    marginTop: 15,
    color: '#333',
  },
  dateInfo: {
    marginTop: 20,
  },
  dateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  dateText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#5E6C84',
  },
  sectionTitle: {
    marginBottom: 15,
  },
  inactiveWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  inactiveWarningText: {
    marginLeft: 10,
    color: 'white',
    flex: 1,
  },
  candidateCard: {
    borderRadius: 10,
    marginBottom: 15,
    padding: 15,
  },
  candidateContent: {
    flex: 1,
  },
  candidateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  candidateNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  candidateName: {
    marginLeft: 15,
    fontSize: 18,
  },
  candidateInfo: {
    marginLeft: 43,
    fontSize: 14,
    lineHeight: 20,
    color: '#5E6C84',
  },
  voteButtonContainer: {
    marginVertical: 25,
  },
  voteButton: {
    height: 50,
    borderRadius: 10,
  },
  resultsButton: {
    height: 50,
    borderRadius: 10,
  },
  securityInfo: {
    marginTop: 20,
    marginBottom: 30,
  },
  securityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  securityText: {
    marginLeft: 15,
    fontSize: 14,
    color: '#5E6C84',
    flex: 1,
  },
});