import { Tabs } from 'expo-router';
import TabBarIsland from '../../components/TabBarIsland';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
      }}
      tabBar={(props) => <TabBarIsland {...props} />}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="entries" />
      <Tabs.Screen name="settings" />
    </Tabs>
  );
}
