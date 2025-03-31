import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Card, Text, Button, Divider, useTheme, Icon } from '@rneui/themed';
import { router } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { getElections } from '../../utils/firebase';
import { Ionicons } from '@expo/vector-icons';
import { verifyBlockchain } from '../../utils/blockchain';

// Types
interface Election {
  id: string;
  title: string;
  description: string;
  startDate: any;
  endDate: any;
  candidates: any[];
  voters: string[];
  isActive: boolean;
}

export default function HomeScreen() {
  const { theme } = useTheme();
  const { user, userProfile } = useAuth();
  const [activeElections, setActiveElections] = useState<Election[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [blockchainStatus, setBlockchainStatus] = useState({ valid: true, blockCount: 0 });

  const fetchData = async () => {
    setLoading(true);
    try {
      const { elections, error } = await getElections(true);
      if (elections && !error) {
        setActiveElections(elections);
      }
      
      // Verify blockchain integrity
      const status = await verifyBlockchain();
      setBlockchainStatus(status);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const isAdmin = userProfile?.isAdmin === true;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.welcomeSection}>
        <View style={styles.welcomeHeader}>
          <Text h4 style={{ color: theme.colors.black }}>
            Welcome, {userProfile?.name || 'User'}
          </Text>
          
          {isAdmin && (
            <View style={[styles.adminBadge, { backgroundColor: theme.colors.primary }]}>
              <Ionicons name="shield-outline" size={14} color="white" />
              <Text style={styles.adminBadgeText}>Admin</Text>
            </View>
          )}
        </View>
        
        <Text style={{ color: theme.colors.grey4, marginTop: 5 }}>
          Welcome to the blockchain-based voting system
        </Text>
      </View>

      <Card containerStyle={[styles.statusCard, { backgroundColor: theme.colors.white }]}>
        <View style={styles.statusRow}>
          <View style={styles.statusItem}>
            <Ionicons
              name="shield-checkmark-outline"
              size={24}
              color={blockchainStatus.valid ? theme.colors.success : theme.colors.error}
            />
            <Text style={styles.statusLabel}>Blockchain Status</Text>
            <Text style={{ color: blockchainStatus.valid ? theme.colors.success : theme.colors.error }}>
              {blockchainStatus.valid ? "Valid" : "Invalid"}
            </Text>
          </View>
          
          <View style={styles.statusDivider} />
          
          <View style={styles.statusItem}>
            <Ionicons
              name="layers-outline"
              size={24}
              color={theme.colors.primary}
            />
            <Text style={styles.statusLabel}>Total Blocks</Text>
            <Text style={{ color: theme.colors.black, fontWeight: 'bold' }}>
              {blockchainStatus.blockCount}
            </Text>
          </View>
          
          <View style={styles.statusDivider} />
          
          <View style={styles.statusItem}>
            <Ionicons
              name="people-outline"
              size={24}
              color={theme.colors.primary}
            />
            <Text style={styles.statusLabel}>Active Elections</Text>
            <Text style={{ color: theme.colors.black, fontWeight: 'bold' }}>
              {activeElections.length}
            </Text>
          </View>
        </View>
      </Card>

      {isAdmin && (
        <Card containerStyle={[styles.adminCard, { backgroundColor: theme.colors.primary }]}>
          <View style={styles.adminCardContent}>
            <View>
              <Text style={styles.adminCardTitle}>Admin Dashboard</Text>
              <Text style={styles.adminCardDescription}>
                Manage elections and view election results
              </Text>
            </View>
            <Button
              title="Go to Admin"
              onPress={() => router.push('/(tabs)/admin')}
              buttonStyle={[styles.adminButton, { backgroundColor: 'white' }]}
              titleStyle={{ color: theme.colors.primary }}
              icon={
                <Ionicons
                  name="settings-outline"
                  size={20}
                  color={theme.colors.primary}
                  style={{ marginRight: 10 }}
                />
              }
            />
          </View>
        </Card>
      )}

      <View style={styles.sectionHeader}>
        <Text h4 style={{ color: theme.colors.black }}>
          Active Elections
        </Text>
        <TouchableOpacity onPress={() => router.push('/(tabs)/elections')}>
          <Text style={{ color: theme.colors.primary }}>See All</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={theme.colors.primary} style={styles.loader} />
      ) : activeElections.length > 0 ? (
        activeElections.slice(0, 2).map((election, index) => (
          <Card key={index} containerStyle={[styles.card, { backgroundColor: theme.colors.white }]}>
            <Card.Title style={styles.cardTitle}>{election.title}</Card.Title>
            <Card.Divider />
            <Text style={styles.cardDescription}>{election.description}</Text>
            <View style={styles.cardDetails}>
              <View style={styles.detailItem}>
                <Ionicons name="calendar-outline" size={16} color={theme.colors.grey4} />
                <Text style={styles.detailText}>
                  Start: {election.startDate.toDate().toLocaleDateString()}
                </Text>
              </View>
              <View style={styles.detailItem}>
                <Ionicons name="time-outline" size={16} color={theme.colors.grey4} />
                <Text style={styles.detailText}>
                  End: {election.endDate.toDate().toLocaleDateString()}
                </Text>
              </View>
              <View style={styles.detailItem}>
                <Ionicons name="people-outline" size={16} color={theme.colors.grey4} />
                <Text style={styles.detailText}>
                  Candidates: {election.candidates.length}
                </Text>
              </View>
            </View>
            
            {isAdmin ? (
              <Button
                title="View as Admin"
                onPress={() => router.push(`/election/${election.id}`)}
                buttonStyle={[
                  styles.voteButton,
                  { backgroundColor: theme.colors.secondary }
                ]}
                icon={
                  <Ionicons
                    name="eye-outline"
                    size={20}
                    color="white"
                    style={{ marginRight: 10 }}
                  />
                }
              />
            ) : (
              <Button
                title={
                  election.voters.includes(user?.uid || '')
                    ? "You already voted"
                    : "Vote Now"
                }
                disabled={election.voters.includes(user?.uid || '')}
                onPress={() => router.push(`/election/${election.id}`)}
                buttonStyle={[
                  styles.voteButton,
                  {
                    backgroundColor: election.voters.includes(user?.uid || '')
                      ? theme.colors.grey2
                      : theme.colors.primary,
                  },
                ]}
                icon={
                  election.voters.includes(user?.uid || '') ? (
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color="white"
                      style={{ marginRight: 10 }}
                    />
                  ) : (
                    <Ionicons
                      name="checkbox-outline"
                      size={20}
                      color="white"
                      style={{ marginRight: 10 }}
                    />
                  )
                }
              />
            )}
            
            {(election.voters.includes(user?.uid || '') || isAdmin) && (
              <Button
                title="View Results"
                type="outline"
                onPress={() => router.push(`/election/${election.id}/results`)}
                buttonStyle={{
                  borderColor: theme.colors.secondary,
                  borderWidth: 2,
                  borderRadius: 10,
                  marginTop: 10,
                }}
                titleStyle={{ color: theme.colors.secondary }}
                icon={
                  <Ionicons
                    name="stats-chart-outline"
                    size={20}
                    color={theme.colors.secondary}
                    style={{ marginRight: 10 }}
                  />
                }
              />
            )}
          </Card>
        ))
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="calendar-outline" size={50} color={theme.colors.grey3} />
          <Text style={[styles.emptyText, { color: theme.colors.grey4 }]}>
            No active elections at the moment
          </Text>
        </View>
      )}

      {activeElections.length > 0 && (
        <Button
          title="View All Elections"
          type="outline"
          onPress={() => router.push('/(tabs)/elections')}
          buttonStyle={{
            borderColor: theme.colors.primary,
            borderWidth: 2,
            borderRadius: 10,
          }}
          titleStyle={{ color: theme.colors.primary }}
          containerStyle={styles.viewAllButton}
        />
      )}

      <View style={styles.sectionHeader}>
        <Text h4 style={{ color: theme.colors.black }}>
          About Blockchain Voting
        </Text>
      </View>

      <Card containerStyle={[styles.infoCard, { backgroundColor: theme.colors.white }]}>
        <View style={styles.infoItem}>
          <Ionicons name="shield-checkmark" size={24} color={theme.colors.success} />
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoTitle}>Secure</Text>
            <Text style={styles.infoDescription}>
              Your vote is encrypted and secured using blockchain technology
            </Text>
          </View>
        </View>

        <Divider style={{ marginVertical: 15 }} />

        <View style={styles.infoItem}>
          <Ionicons name="eye-off" size={24} color={theme.colors.primary} />
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoTitle}>Private</Text>
            <Text style={styles.infoDescription}>
              Your identity is protected while ensuring transparent voting
            </Text>
          </View>
        </View>

        <Divider style={{ marginVertical: 15 }} />

        <View style={styles.infoItem}>
          <Ionicons name="sync" size={24} color={theme.colors.warning} />
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoTitle}>Immutable</Text>
            <Text style={styles.infoDescription}>
              Once cast, votes cannot be altered or tampered with
            </Text>
          </View>
        </View>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 15,
    paddingBottom: 40,
  },
  welcomeSection: {
    marginBottom: 20,
  },
  welcomeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 15,
  },
  adminBadgeText: {
    color: 'white',
    marginLeft: 5,
    fontSize: 12,
    fontWeight: 'bold',
  },
  adminCard: {
    borderRadius: 15,
    marginVertical: 15,
    padding: 15,
  },
  adminCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  adminCardTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  adminCardDescription: {
    color: 'white',
    opacity: 0.9,
  },
  adminButton: {
    borderRadius: 10,
    paddingHorizontal: 15,
  },
  statusCard: {
    borderRadius: 15,
    marginVertical: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusItem: {
    flex: 1,
    alignItems: 'center',
    padding: 10,
  },
  statusLabel: {
    fontSize: 12,
    color: '#8F9BB3',
    marginTop: 5,
    marginBottom: 2,
  },
  statusDivider: {
    width: 1,
    height: '80%',
    backgroundColor: '#EDF1F7',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 25,
    marginBottom: 15,
  },
  card: {
    borderRadius: 15,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardTitle: {
    fontSize: 18,
    textAlign: 'left',
    color:'#000',
  },
  cardDescription: {
    marginBottom: 15,
  },
  cardDetails: {
    marginBottom: 15,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  detailText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#5E6C84',
  },
  voteButton: {
    borderRadius: 10,
    paddingVertical: 12,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  emptyText: {
    marginTop: 15,
    textAlign: 'center',
    fontSize: 16,
  },
  viewAllButton: {
    marginVertical: 15,
  },
  infoCard: {
    borderRadius: 15,
    marginBottom: 30,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoTextContainer: {
    marginLeft: 15,
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 3,
  },
  infoDescription: {
    fontSize: 14,
    color: '#5E6C84',
  },
  loader: {
    marginVertical: 20,
  },
});