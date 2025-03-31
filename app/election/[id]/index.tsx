// app/election/[id]/index.tsx

import React, { useEffect, useState } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert 
} from 'react-native';
import { Text, Card, Button, useTheme, Divider } from '@rneui/themed';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getElectionById } from '../../../utils/firebase';
import { getElectionVotes } from '../../../utils/blockchain';

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
  candidates: any; // Changed from Candidate[] to any to handle both array and object formats
  voters: string[];
  isActive: boolean;
}

interface VoteRecord {
  blockHash: string;
  blockIndex: number;
  candidateId: number;
  timestamp: number;
  voteHash: string;
}

export default function ResultsScreen() {
  const { theme } = useTheme();
  const { id: electionId } = useLocalSearchParams<{ id: string }>();
  const [election, setElection] = useState<Election | null>(null);
  const [voteRecords, setVoteRecords] = useState<VoteRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [blockchainVerified, setBlockchainVerified] = useState(false);
  const [processedCandidates, setProcessedCandidates] = useState<Candidate[]>([]);

  useEffect(() => {
    const fetchElectionData = async () => {
      if (electionId) {
        try {
          console.log("Fetching election data for ID:", electionId);
          
          // Fetch election details from Firebase
          const { election: fetchedElection, error } = await getElectionById(electionId);
          
          console.log("Election data result:", fetchedElection ? "Data received" : "No data", 
                      error ? `Error: ${error}` : "No error");
          
          if (fetchedElection && !error) {
            console.log("Election data:", JSON.stringify(fetchedElection, null, 2).substring(0, 200) + "...");
            setElection(fetchedElection as Election);
            
            // Process candidates - handle both array and object formats
            const candidates = processCandidates(fetchedElection.candidates);
            setProcessedCandidates(candidates);
            
            // Fetch blockchain vote records
            try {
              const votes = await getElectionVotes(electionId);
              setVoteRecords(votes);
              
              // Verify if blockchain votes match Firebase vote counts
              const isVerified = verifyVoteCounts(candidates, votes);
              setBlockchainVerified(isVerified);
            } catch (blockchainError) {
              console.error("Error fetching blockchain data:", blockchainError);
            }
          } else {
            console.error("Could not fetch election:", error);
            Alert.alert('Error', error || 'Could not fetch election details');
            router.back();
          }
        } catch (error) {
          console.error('Error fetching election data:', error);
          Alert.alert('Error', 'An error occurred while fetching election data');
          router.back();
        } finally {
          setLoading(false);
        }
      }
    };
  
    fetchElectionData();
  }, [electionId]);

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

  // Verify that blockchain vote counts match Firebase candidate vote counts
  const verifyVoteCounts = (candidates: Candidate[], votes: VoteRecord[]): boolean => {
    if (!candidates || candidates.length === 0) {
      console.error("Invalid candidates data:", candidates);
      return false;
    }
    
    if (!votes || !Array.isArray(votes)) {
      console.error("Invalid votes data:", votes);
      return false;
    }
    
    try {
      // Count votes by candidate from blockchain records
      const blockchainVoteCounts = new Map<number, number>();
      votes.forEach(vote => {
        const currentCount = blockchainVoteCounts.get(vote.candidateId) || 0;
        blockchainVoteCounts.set(vote.candidateId, currentCount + 1);
      });
      
      // Compare with Firebase candidate vote counts
      for (const candidate of candidates) {
        const blockchainCount = blockchainVoteCounts.get(candidate.id) || 0;
        if (blockchainCount !== candidate.voteCount) {
          return false;
        }
      }
      
      return true;
    } catch (error) {
      console.error("Error verifying vote counts:", error);
      return false;
    }
  };

  // Calculate total votes from processed candidates
  const totalVotes = processedCandidates.reduce((sum, candidate) => sum + candidate.voteCount, 0);

  // Calculate percentage for a candidate
  const calculatePercentage = (voteCount: number): string => {
    if (totalVotes === 0) return '0%';
    return `${((voteCount / totalVotes) * 100).toFixed(1)}%`;
  };

  // Sort candidates by vote count (descending)
  const sortedCandidates = [...processedCandidates].sort((a, b) => b.voteCount - a.voteCount);

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ marginTop: 20, color: theme.colors.grey4 }}>
          Loading election results...
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

  // Determine if the election has ended
  const now = new Date();
  const endDate = election.endDate.toDate();
  const hasEnded = endDate < now;

  // Find the winner (if election has ended)
  const winner = hasEnded && sortedCandidates.length > 0 && sortedCandidates[0].voteCount > 0
    ? sortedCandidates[0]
    : null;

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
          <Text h4 style={styles.headerTitle}>Election Results</Text>
          <View style={{ width: 40 }} />
        </View>

        <Card containerStyle={[styles.electionCard, { backgroundColor: theme.colors.white }]}>
          <Text h4 style={styles.electionTitle}>{election.title}</Text>
          <Text style={styles.electionDescription}>{election.description}</Text>
          
          <View style={styles.statusRow}>
            <View style={styles.statusItem}>
              <Ionicons 
                name={hasEnded ? "checkmark-circle" : "time-outline"} 
                size={22} 
                color={hasEnded ? theme.colors.success : theme.colors.warning} 
              />
              <Text style={[
                styles.statusText, 
                { color: hasEnded ? theme.colors.success : theme.colors.warning }
              ]}>
                {hasEnded ? "Completed" : "In Progress"}
              </Text>
            </View>
            
            <View style={styles.statusItem}>
              <Ionicons 
                name="people-outline" 
                size={22} 
                color={theme.colors.primary} 
              />
              <Text style={styles.infoText}>
                {election.voters?.length || 0} Votes
              </Text>
            </View>
            
            <View style={styles.statusItem}>
              <Ionicons 
                name={blockchainVerified ? "shield-checkmark" : "alert-circle"} 
                size={22} 
                color={blockchainVerified ? theme.colors.success : theme.colors.error} 
              />
              <Text style={[
                styles.statusText, 
                { color: blockchainVerified ? theme.colors.success : theme.colors.error }
              ]}>
                {blockchainVerified ? "Verified" : "Unverified"}
              </Text>
            </View>
          </View>
        </Card>

        {winner && (
          <Card containerStyle={[styles.winnerCard, { backgroundColor: theme.colors.success }]}>
            <View style={styles.winnerContent}>
              <Ionicons name="trophy" size={40} color="white" />
              <View style={styles.winnerInfo}>
                <Text style={styles.winnerLabel}>Winner</Text>
                <Text h4 style={styles.winnerName}>{winner.name}</Text>
                <Text style={styles.winnerVotes}>
                  {winner.voteCount} votes ({calculatePercentage(winner.voteCount)})
                </Text>
              </View>
            </View>
          </Card>
        )}

        <Card containerStyle={[styles.resultsCard, { backgroundColor: theme.colors.white }]}>
          <Card.Title>Results Breakdown</Card.Title>
          <Card.Divider />
          
          {!hasEnded && (
            <View style={[styles.warningBanner, { backgroundColor: theme.colors.warning }]}>
              <Ionicons name="information-circle" size={22} color="white" />
              <Text style={styles.warningText}>
                Election is still in progress. Results may change.
              </Text>
            </View>
          )}
          
          {sortedCandidates.length > 0 ? (
            sortedCandidates.map((candidate, index) => {
              const percentage = calculatePercentage(candidate.voteCount);
              const isWinner = hasEnded && winner?.id === candidate.id;
              
              return (
                <View key={candidate.id || index} style={styles.candidateResult}>
                  <View style={styles.candidateResultHeader}>
                    <View style={styles.candidateInfo}>
                      <Text style={styles.candidateRank}>#{index + 1}</Text>
                      <Text style={styles.candidateName}>{candidate.name}</Text>
                      {isWinner && (
                        <View style={[styles.winnerBadge, { backgroundColor: theme.colors.success }]}>
                          <Text style={styles.winnerBadgeText}>Winner</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.voteCount}>
                      {candidate.voteCount} votes ({percentage})
                    </Text>
                  </View>
                  
                  <View style={styles.progressBarContainer}>
                    <View 
                      style={[
                        styles.progressBar,
                        { 
                          backgroundColor: isWinner ? theme.colors.success : theme.colors.primary,
                          width: `${(candidate.voteCount / (Math.max(...sortedCandidates.map(c => c.voteCount)) || 1)) * 100}%`
                        }
                      ]} 
                    />
                  </View>
                  
                  {index < sortedCandidates.length - 1 && <Divider style={{ marginVertical: 15 }} />}
                </View>
              );
            })
          ) : (
            <View style={styles.noCandidatesContainer}>
              <Ionicons name="person-outline" size={40} color={theme.colors.grey3} />
              <Text style={{ color: theme.colors.grey4, marginTop: 10 }}>
                No candidate information available
              </Text>
            </View>
          )}
        </Card>

        <Card containerStyle={[styles.blockchainCard, { backgroundColor: theme.colors.white }]}>
          <Card.Title>Blockchain Verification</Card.Title>
          <Card.Divider />
          
          <View style={styles.blockchainStatus}>
            <Ionicons 
              name={blockchainVerified ? "shield-checkmark" : "alert-circle"} 
              size={30} 
              color={blockchainVerified ? theme.colors.success : theme.colors.error} 
            />
            <Text style={[
              styles.blockchainStatusText, 
              { color: blockchainVerified ? theme.colors.success : theme.colors.error }
            ]}>
              {blockchainVerified 
                ? "Blockchain records match the vote count" 
                : "Warning: Blockchain records do not match vote count"
              }
            </Text>
          </View>
          
          <View style={styles.blockchainInfo}>
            <Text style={styles.blockchainInfoTitle}>Blockchain Records</Text>
            <Text style={styles.blockchainInfoText}>
              Total Transactions: {voteRecords.length}
            </Text>
          </View>
          
          <Button
            title="View Blockchain Transactions"
            type="outline"
            buttonStyle={{ borderColor: theme.colors.primary }}
            titleStyle={{ color: theme.colors.primary }}
            containerStyle={{ marginTop: 15 }}
            icon={
              <Ionicons 
                name="code" 
                size={20} 
                color={theme.colors.primary} 
                style={{ marginRight: 10 }}
              />
            }
            onPress={() => Alert.alert('Blockchain Transactions', 'This feature would display detailed blockchain transaction data in a production app.')}
          />
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 15,
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
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  electionCard: {
    borderRadius: 10,
    marginBottom: 15,
  },
  electionTitle: {
    marginBottom: 10,
  },
  electionDescription: {
    marginBottom: 15,
    color: '#5E6C84',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    marginLeft: 5,
    fontWeight: 'bold',
  },
  infoText: {
    marginLeft: 5,
    color: '#5E6C84',
  },
  winnerCard: {
    borderRadius: 10,
    marginBottom: 15,
    padding: 15,
  },
  winnerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  winnerInfo: {
    marginLeft: 20,
  },
  winnerLabel: {
    color: 'white',
    opacity: 0.8,
    marginBottom: 5,
  },
  winnerName: {
    color: 'white',
    marginBottom: 5,
  },
  winnerVotes: {
    color: 'white',
    fontWeight: 'bold',
  },
  resultsCard: {
    borderRadius: 10,
    marginBottom: 15,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 5,
    marginBottom: 15,
  },
  warningText: {
    color: 'white',
    marginLeft: 10,
    flex: 1,
  },
  candidateResult: {
    marginBottom: 5,
  },
  candidateResultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  candidateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  candidateRank: {
    fontWeight: 'bold',
    marginRight: 10,
  },
  candidateName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  winnerBadge: {
    marginLeft: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  winnerBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  voteCount: {
    color: '#5E6C84',
  },
  progressBarContainer: {
    height: 10,
    backgroundColor: '#EDF1F7',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 5,
  },
  blockchainCard: {
    borderRadius: 10,
    marginBottom: 15,
  },
  blockchainStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  blockchainStatusText: {
    marginLeft: 10,
    flex: 1,
    fontWeight: 'bold',
  },
  blockchainInfo: {
    backgroundColor: '#F8F9FF',
    padding: 15,
    borderRadius: 5,
  },
  blockchainInfoTitle: {
    fontWeight: 'bold',
    marginBottom: 5,
  },
  blockchainInfoText: {
    color: '#5E6C84',
  },
  noCandidatesContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
});