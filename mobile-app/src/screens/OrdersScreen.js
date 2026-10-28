import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../components/Header';
import EmptyState from '../components/EmptyState';
import { Colors } from '../theme/colors';
import { api } from '../services/apiClient';
import { ENDPOINTS } from '../config/api';
import { useAuth } from '../context/AuthContext';

export default function OrdersScreen({ navigation }) {
  const { isAuthenticated } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      setRefreshing(false);
      return;
    }
    try {
      const res = await api.get(ENDPOINTS.ORDERS);
      if (res && (res.orders || res.data)) {
        setOrders(res.orders || res.data);
      } else {
        setOrders([]);
      }
    } catch (err) {
      console.warn('[Orders] Error loading orders:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const getStatusColor = (status = '') => {
    switch (status.toUpperCase()) {
      case 'CONFIRMED':
      case 'PAID':
      case 'DELIVERED':
        return Colors.success;
      case 'PENDING':
        return Colors.warning;
      case 'CANCELLED':
      case 'FAILED':
        return Colors.danger;
      default:
        return Colors.secondary;
    }
  };

  if (!isAuthenticated) {
    return (
      <View style={styles.screen}>
        <Header navigation={navigation} title="Order History" />
        <EmptyState
          icon="lock-closed-outline"
          title="Sign In Required"
          description="Log in with your IntelliCart account to access your past orders and tracking."
          buttonText="Sign In Now"
          onButtonPress={() => navigation.navigate('Login')}
        />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <Header navigation={navigation} title="My Orders" />

      {loading && !refreshing ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Fetching your orders...</Text>
        </View>
      ) : orders.length === 0 ? (
        <EmptyState
          icon="receipt-outline"
          title="No Orders Placed Yet"
          description="You haven't placed any orders with IntelliCart AI yet. Start shopping our catalog!"
          buttonText="Explore Products"
          onButtonPress={() => navigation.navigate('Catalog')}
        />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => (item._id || item.id).toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.secondary}
            />
          }
          renderItem={({ item }) => {
            const dateStr = item.createdAt
              ? new Date(item.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })
              : 'Recent';

            const itemsCount = item.items ? item.items.length : 0;
            const status = item.orderStatus || item.status || 'PENDING';

            return (
              <TouchableOpacity
                style={styles.orderCard}
                activeOpacity={0.88}
                onPress={() => navigation.navigate('OrderDetail', { orderId: item._id })}
              >
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.orderId}>
                      Order #{item._id.slice(-6).toUpperCase()}
                    </Text>
                    <Text style={styles.orderDate}>{dateStr}</Text>
                  </View>

                  <View
                    style={[
                      styles.statusPill,
                      { backgroundColor: `${getStatusColor(status)}20` },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusPillText,
                        { color: getStatusColor(status) },
                      ]}
                    >
                      {status}
                    </Text>
                  </View>
                </View>

                <View style={styles.cardDivider} />

                <View style={styles.cardFooter}>
                  <View>
                    <Text style={styles.footerLabel}>Items</Text>
                    <Text style={styles.footerVal}>
                      {itemsCount} {itemsCount === 1 ? 'Product' : 'Products'}
                    </Text>
                  </View>

                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.footerLabel}>Total Amount</Text>
                    <Text style={styles.footerAmount}>
                      ₹{(item.totalAmount || item.total || 0).toLocaleString('en-IN')}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: Colors.textMuted,
    marginTop: 12,
    fontSize: 14,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  orderCard: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  orderId: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  orderDate: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  cardDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  footerVal: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '600',
    marginTop: 2,
  },
  footerAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginTop: 2,
  },
});
