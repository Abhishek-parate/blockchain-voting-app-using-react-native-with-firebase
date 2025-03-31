// app/(tabs)/admin.tsx

import React, { useEffect, useState } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  RefreshControl, 
  Alert,
  ActivityIndicator
} from 'react-native';
import { Text, Card, Button, Icon, useTheme, Tab, TabView, FAB } from '@rneui/themed';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { getElections } from '../../utils/firebase';
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
  createdBy: string;
}

export default function AdminScreen() {
  const { theme } = useTheme();
  const { user, userProfile } = useAuth();
  const [elections, setElections] = useState<Election[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [blockchainStatus, setBlockchainStatus] = useState({ valid: true, blockCount: 0 });

  // Redirect non-admin users
  useEffect(() => {
    if (userProfile && !userProfile.isAdmin) {
      Alert.alert('Access Denied', 'You do not have permission to access this area.');
      router.replace('/(tabs)/home');
    }
  }, [userProfile]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Get all elections (admin sees everything)
      const { elections: fetchedElections, error } = await getElections(false);
      if (fetchedElections && !error) {
        setElections(fetchedElections);
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

  useEffect(() => {
    if (userProfile?.isAdmin) {
      fetchData();
    }
  }, [userProfile]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  // Filter elections based on tab
  const filteredElections = elections.filter(election => {
    if (activeTab === 0) { // All elections
      return true;
    } else if (activeTab === 1) { // Active elections
      return election.isActive;
    } else if (activeTab === 2) { // My created elections
      return election.createdBy === user?.uid;
    }
    return true;
  });

  // Admin view for election card
  const renderElectionItem = (election: Election) => {
    const now = new Date();
    const startDate = election.startDate.toDate();
    const endDate = election.endDate.toDate();
    
    const hasStarted = startDate <= now;
    const hasEnded = endDate < now;
    
    let status = 'Scheduled';
    let statusColor = theme.colors.warning;
    
    if (hasStarted && !hasEnded) {
      status = 'Active';
      statusColor = theme.colors.success;
    } else if (hasEnded) {
      status = 'Ended';
      statusColor = theme.colors.error;
    }
    
    return (
      <Card key={election.id} containerStyle={[styles.card, { backgroundColor: theme.colors.white }]}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{election.title}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.statusText}>{status}</Text>
          </View>
        </View>
        
        <Card.Divider />
        
        <Text style={styles.cardDescription} numberOfLines={2}>
          {election.description}
        </Text>
        
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{election.candidates.length}</Text>
            <Text style={styles.statLabel}>Candidates</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{election.voters.length}</Text>
            <Text style={styles.statLabel}>Votes</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{election.isActive ? 'Yes' : 'No'}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
        </View>
        
        <View style={styles.dateInfo}>
          <View style={styles.dateItem}>
            <Ionicons name="calendar-outline" size={16} color={theme.colors.grey4} />
            <Text style={styles.dateText}>
              Start: {startDate.toLocaleDateString()}
            </Text>
          </View>
          <View style={styles.dateItem}>
            <Ionicons name="time-outline" size={16} color={theme.colors.grey4} />
            <Text style={styles.dateText}>
              End: {endDate.toLocaleDateString()}
            </Text>
          </View>
        </View>
        
        <View style={styles.cardActions}>
          <Button
            title="Edit"
            type="outline"
            buttonStyle={{
              borderColor: theme.colors.primary,
              borderRadius: 10,
            }}
            titleStyle={{ color: theme.colors.primary }}
            containerStyle={{ flex: 1, marginRight: 8 }}
            onPress={() => router.push(`/admin/election/${election.id}/edit`)}
            icon={
              <Ionicons
                name="create-outline"
                size={18}
                color={theme.colors.primary}
                style={{ marginRight: 8 }}
              />
            }
          />
          
          <Button
            title="Results"
            buttonStyle={{
              backgroundColor: theme.colors.secondary,
              borderRadius: 10,
            }}
            containerStyle={{ flex: 1, marginLeft: 8 }}
            onPress={() => router.push(`/election/${election.id}/results`)}
            icon={
              <Ionicons
                name="stats-chart-outline"
                size={18}
                color="white"
                style={{ marginRight: 8 }}
              />
            }
          />
        </View>
      </Card>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Blockchain Status Card */}
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
            <Text style={styles.statusLabel}>Total Elections</Text>
            <Text style={{ color: theme.colors.black, fontWeight: 'bold' }}>
              {elections.length}
            </Text>
          </View>
        </View>
      </Card>
      
      <Tab
        value={activeTab}
        onChange={setActiveTab}
        indicatorStyle={{ backgroundColor: theme.colors.primary }}
        containerStyle={{ backgroundColor: theme.colors.background }}
      >
        <Tab.Item
          title="All"
          titleStyle={{ color: activeTab === 0 ? theme.colors.primary : theme.colors.grey3 }}
        />
        <Tab.Item
          title="Active"
          titleStyle={{ color: activeTab === 1 ? theme.colors.primary : theme.colors.grey3 }}
        />
        <Tab.Item
          title="My Elections"
          titleStyle={{ color: activeTab === 2 ? theme.colors.primary : theme.colors.grey3 }}
        />
      </Tab>
      
      <TabView value={activeTab} onChange={setActiveTab} animationType="spring">
        {[0, 1, 2].map((tabIndex) => (
          <TabView.Item key={tabIndex} style={styles.tabViewItem}>
            {loading ? (
              <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={{ marginTop: 10, color: theme.colors.grey4 }}>
                  Loading elections...
                </Text>
              </View>
            ) : filteredElections.length > 0 ? (
              <ScrollView
                contentContainerStyle={styles.scrollContainer}
                refreshControl={
                  <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
              >
                {filteredElections.map(renderElectionItem)}
              </ScrollView>
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="calendar-outline" size={50} color={theme.colors.grey3} />
                <Text style={{ color: theme.colors.grey4, marginTop: 20, textAlign: 'center' }}>
                  {tabIndex === 0
                    ? "No elections found"
                    : tabIndex === 1
                    ? "No active elections at the moment"
                    : "You haven't created any elections yet"}
                </Text>
              </View>
            )}
          </TabView.Item>
        ))}
      </TabView>
      
      <FAB
        visible={true}
        icon={{ name: 'add', color: 'white' }}
        color={theme.colors.primary}
        placement="right"
        onPress={() => router.push('/admin/create-election')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  statusCard: {
    borderRadius: 15,
    margin: 15,
    marginBottom: 5,
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
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabViewItem: {
    width: '100%',
  },
  scrollContainer: {
    padding: 15,
    paddingBottom: 80, // Extra padding for FAB
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    borderRadius: 15,
    marginBottom: 15,
    padding: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  statusBadge: {
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  cardDescription: {
    marginVertical: 10,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 15,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    color: '#8F9BB3',
    marginTop: 5,
  },
  dateInfo: {
    marginBottom: 15,
  },
  dateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  dateText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#5E6C84',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  }
});