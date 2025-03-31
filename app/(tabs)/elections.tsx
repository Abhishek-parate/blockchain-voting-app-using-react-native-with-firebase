// app/(tabs)/elections.tsx

import React, { useEffect, useState } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  ActivityIndicator, 
  RefreshControl, 
  TouchableOpacity,
  FlatList
} from 'react-native';
import { Text, Card, Button, SearchBar, useTheme, Tab, TabView } from '@rneui/themed';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { getElections } from '../../utils/firebase';

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

export default function ElectionsScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [elections, setElections] = useState<Election[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  
  const fetchElections = async () => {
    setLoading(true);
    try {
      const { elections: fetchedElections, error } = await getElections(false);
      if (fetchedElections && !error) {
        setElections(fetchedElections);
      }
    } catch (error) {
      console.error('Error fetching elections:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchElections();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchElections();
    setRefreshing(false);
  };

  const handleSearch = (text: string) => {
    setSearch(text);
  };

  // Filter elections based on search and tab
  const filteredElections = elections.filter(election => {
    const matchesSearch = election.title.toLowerCase().includes(search.toLowerCase()) ||
                          election.description.toLowerCase().includes(search.toLowerCase());
    
    if (activeTab === 0) { // All elections
      return matchesSearch;
    } else if (activeTab === 1) { // Active elections
      return matchesSearch && election.isActive;
    } else if (activeTab === 2) { // My voted elections
      return matchesSearch && election.voters.includes(user?.uid || '');
    }
    
    return matchesSearch;
  });

  const renderElectionCard = ({ item: election }: { item: Election }) => {
    const hasVoted = election.voters.includes(user?.uid || '');
    const isActive = election.isActive;
    const now = new Date();
    const endDate = election.endDate.toDate();
    const isEnded = endDate < now;
    
    return (
      <Card containerStyle={[styles.card, { backgroundColor: theme.colors.white }]}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{election.title}</Text>
          {hasVoted && (
            <View style={[styles.votedBadge, { backgroundColor: theme.colors.success }]}>
              <Text style={styles.votedText}>Voted</Text>
            </View>
          )}
        </View>
        
        <Card.Divider />
        
        <Text style={styles.cardDescription} numberOfLines={2}>
          {election.description}
        </Text>
        
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
          <View style={styles.detailItem}>
            <Ionicons
              name={isActive ? "checkmark-circle-outline" : "close-circle-outline"}
              size={16}
              color={isActive ? theme.colors.success : theme.colors.error}
            />
            <Text
              style={[
                styles.detailText,
                {
                  color: isActive
                    ? theme.colors.success
                    : theme.colors.error,
                },
              ]}
            >
              {isActive ? "Active" : "Inactive"}
            </Text>
          </View>
        </View>
        
        <View style={styles.cardActions}>
          <Button
            title="View Details"
            type="outline"
            buttonStyle={{
              borderColor: theme.colors.primary,
              borderRadius: 10,
            }}
            titleStyle={{ color: theme.colors.primary }}
            containerStyle={{ flex: 1, marginRight: 8 }}
            onPress={() => router.push(`/election/${election.id}/details`)}
          />
          
          <Button
            title={hasVoted ? "Results" : isEnded ? "Ended" : "Vote Now"}
            disabled={!isActive || (isEnded && !hasVoted)}
            buttonStyle={{
              backgroundColor: hasVoted
                ? theme.colors.secondary
                : isEnded
                ? theme.colors.grey3
                : theme.colors.primary,
              borderRadius: 10,
            }}
            containerStyle={{ flex: 1, marginLeft: 8 }}
            onPress={() => router.push(
              hasVoted
                ? `/election/${election.id}/results`
                : `/election/${election.id}`
            )}
          />
        </View>
      </Card>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <SearchBar
        placeholder="Search elections..."
        onChangeText={handleSearch}
        value={search}
        containerStyle={[
          styles.searchBarContainer,
          { backgroundColor: theme.colors.background },
        ]}
        inputContainerStyle={[
          styles.searchBarInputContainer,
          { backgroundColor: theme.colors.white },
        ]}
        round
        lightTheme
      />
      
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
          title="Voted"
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
              <FlatList
                data={filteredElections}
                renderItem={renderElectionCard}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContainer}
                refreshControl={
                  <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
              />
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="calendar-outline" size={50} color={theme.colors.grey3} />
                <Text style={{ color: theme.colors.grey4, marginTop: 20, textAlign: 'center' }}>
                  {search
                    ? "No elections match your search"
                    : tabIndex === 0
                    ? "No elections found"
                    : tabIndex === 1
                    ? "No active elections at the moment"
                    : "You haven't voted in any elections yet"}
                </Text>
              </View>
            )}
          </TabView.Item>
        ))}
      </TabView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchBarContainer: {
    borderTopWidth: 0,
    borderBottomWidth: 0,
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 5,
  },
  searchBarInputContainer: {
    borderRadius: 10,
    height: 40,
  },
  tabViewItem: {
    width: '100%',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: 10,
    paddingBottom: 50,
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
    marginBottom: 5,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  votedBadge: {
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginLeft: 8,
  },
  votedText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  cardDescription: {
    marginVertical: 10,
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
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
