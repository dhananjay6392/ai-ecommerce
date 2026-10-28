import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { testApiHealth } from '../config/api';

export default function Header({ navigation, title = 'IntelliCart AI' }) {
  const { itemCount } = useCart();
  const { wishlist } = useWishlist();
  const [serverOnline, setServerOnline] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const checkServer = async () => {
      const res = await testApiHealth();
      if (isMounted) {
        setServerOnline(res.success);
      }
    };
    checkServer();
    const interval = setInterval(checkServer, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.leftRow}>
        <View style={styles.logoBadge}>
          <Ionicons name="cart" size={20} color={Colors.secondary} />
        </View>
        <View>
          <Text style={styles.brandTitle}>{title}</Text>
          <TouchableOpacity
            style={styles.statusRow}
            onPress={() => navigation.navigate('ServerConfig')}
          >
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor:
                    serverOnline === true
                      ? Colors.success
                      : serverOnline === false
                      ? Colors.danger
                      : Colors.warning,
                },
              ]}
            />
            <Text style={styles.statusText}>
              {serverOnline === true ? 'Backend Online' : serverOnline === false ? 'Offline (Tap)' : 'Checking...'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.rightRow}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => navigation.navigate('Wishlist')}
        >
          <Ionicons name="heart-outline" size={22} color={Colors.textPrimary} />
          {wishlist.length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{wishlist.length}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => navigation.navigate('Cart')}
        >
          <Ionicons name="bag-handle-outline" size={22} color={Colors.textPrimary} />
          {itemCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{itemCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(6, 182, 212, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.3)',
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: 0.3,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  rightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: Colors.primary,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: Colors.textWhite,
    fontSize: 10,
    fontWeight: '700',
  },
});
