import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  Button,
  FlatList,
  NativeEventEmitter,
  NativeModules,
  StyleSheet,
  PermissionsAndroid,
  Platform,
  Alert,
} from 'react-native';

// Tipos para os dispositivos e mensagens
interface Device {
  name: string;
  address: string;
}

interface Message {
  text: string;
  sent: boolean;
}

// Forma segura de obter o módulo
const getWifiDirectModule = () => {
    if (!NativeModules.WifiDirectModule) {
        console.error('NativeModules:', NativeModules);
        throw new Error('WifiDirectModule não está disponível');
    }
    return NativeModules.WifiDirectModule;
};

try {
    const WifiDirectModule = getWifiDirectModule();
    console.log('WifiDirectModule inicializado com sucesso:', WifiDirectModule);
} catch (error) {
    console.error('Erro ao inicializar WifiDirectModule:', error);
}

const eventEmitter = new NativeEventEmitter(NativeModules.WifiDirectModule || {});

console.log('Módulos nativos disponíveis:', NativeModules);
//console.log('WifiDirectModule:', WifiDirectModule);

const App: React.FC = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentMessage, setCurrentMessage] = useState<string>('');
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);

  useEffect(() => {
    // Configurar listeners de eventos
    const discoveryStarted = eventEmitter.addListener(
      'onDiscoveryStarted',
      () => {
        console.log('Descoberta iniciada');
      }
    );

    const connectionSuccess = eventEmitter.addListener(
      'onConnectionSuccess',
      () => {
        console.log('Conexão estabelecida');
      }
    );

    const messageReceived = eventEmitter.addListener(
      'onMessageReceived',
      (message: string) => {
        setMessages(prev => [...prev, { text: message, sent: false }]);
      }
    );

    // Adicionar listener para dispositivos encontrados
    const peersAvailable = eventEmitter.addListener(
      'onPeersAvailable',
      (deviceList: Device[]) => {
        console.log('Dispositivos encontrados:', deviceList);
        setDevices(deviceList);
      }
    );

    return () => {
      discoveryStarted.remove();
      connectionSuccess.remove();
      messageReceived.remove();
      peersAvailable.remove();
    };
  }, []);

  // const startDiscovery = () => {
  //   WifiDirect.startDiscovery();
  // };
  // Verificação de segurança antes de chamar o método
  const requestPermissions = async () => {
    try {
        // Para Android 13+ (API Level 33)
        if (Platform.OS === 'android' && Number(Platform.Version) >= 33) {
            const nearbyDevices = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.NEARBY_WIFI_DEVICES,
                {
                    title: "Permissão Wi-Fi Direct",
                    message: "Este aplicativo precisa de permissão para encontrar dispositivos próximos",
                    buttonNeutral: "Perguntar depois",
                    buttonNegative: "Cancelar",
                    buttonPositive: "OK"
                }
            );

            if (nearbyDevices !== PermissionsAndroid.RESULTS.GRANTED) {
                console.log('Permissão NEARBY_WIFI_DEVICES negada');
                return false;
            }
        }

        // Para todas as versões do Android
        const locationPermission = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            {
                title: "Permissão de Localização",
                message: "Este aplicativo precisa de acesso à localização para encontrar dispositivos próximos",
                buttonNeutral: "Perguntar depois",
                buttonNegative: "Cancelar",
                buttonPositive: "OK"
            }
        );

        if (locationPermission !== PermissionsAndroid.RESULTS.GRANTED) {
            console.log('Permissão ACCESS_FINE_LOCATION negada');
            return false;
        }

        return true;
    } catch (err) {
        console.warn('Erro ao solicitar permissões:', err);
        return false;
    }
  };

  const handleStartDiscovery = async () => {
    try {
        const module = getWifiDirectModule();
        const hasPermissions = await requestPermissions();
        if (!hasPermissions) {
            Alert.alert(
                "Erro de Permissão",
                "O aplicativo precisa das permissões necessárias para funcionar.",
                [{ text: "OK" }]
            );
            return;
        }

        const result = await module.startDiscovery();
        console.log('Resultado da descoberta:', result);
    } catch (error) {
        console.error('Erro completo:', error);
        Alert.alert(
            "Erro",
            "Não foi possível iniciar a descoberta de dispositivos: " + 
            (error instanceof Error ? error.message : String(error)),
            [{ text: "OK" }]
        );
    }
  };

  const connectToDevice = (device: Device) => {
    setSelectedDevice(device);
    try {
        const module = getWifiDirectModule();
        module.connectToPeer(device.address);
    } catch (error) {
        console.error('Erro ao conectar ao dispositivo:', error);
    }
  };

  const sendMessage = () => {
    if (selectedDevice && currentMessage) {
        try {
            const module = getWifiDirectModule();
            module.sendMessage(currentMessage, selectedDevice.address);
            setMessages(prev => [...prev, { text: currentMessage, sent: true }]);
            setCurrentMessage('');
        } catch (error) {
            console.error('Erro ao enviar mensagem:', error);
        }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Chat Wi-Fi Direct</Text>
        <Button title="Procurar dispositivos" onPress={handleStartDiscovery} />
      </View>

      <View style={styles.deviceList}>
        <Text style={styles.subtitle}>
          Dispositivos disponíveis: {devices.length}
        </Text>
        <FlatList
          data={devices}
          renderItem={({ item }) => (
            <View style={styles.deviceItem}>
              <Text style={styles.deviceName}>{item.name || 'Dispositivo sem nome'}</Text>
              <Button 
                title="Conectar" 
                onPress={() => connectToDevice(item)}
              />
            </View>
          )}
          keyExtractor={item => item.address}
          ListEmptyComponent={() => (
            <Text style={styles.emptyList}>
              Nenhum dispositivo encontrado
            </Text>
          )}
        />
      </View>

      <View style={styles.chatContainer}>
        <FlatList
          data={messages}
          renderItem={({ item }) => (
            <View
              style={[
                styles.message,
                item.sent ? styles.sentMessage : styles.receivedMessage,
              ]}
            >
              <Text style={styles.messageText}>{item.text}</Text>
            </View>
          )}
          keyExtractor={(item, index) => index.toString()}
        />

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={currentMessage}
            onChangeText={setCurrentMessage}
            placeholder="Digite sua mensagem..."
          />
          <Button title="Enviar" onPress={sendMessage} />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  deviceList: {
    padding: 16,
    maxHeight: 200,
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 8,
  },
  chatContainer: {
    flex: 1,
    padding: 16,
  },
  message: {
    padding: 8,
    marginVertical: 4,
    maxWidth: '80%',
    borderRadius: 8,
  },
  sentMessage: {
    backgroundColor: '#007AFF',
    alignSelf: 'flex-end',
  },
  receivedMessage: {
    backgroundColor: '#E5E5EA',
    alignSelf: 'flex-start',
  },
  messageText: {
    color: '#fff',
  },
  inputContainer: {
    flexDirection: 'row',
    marginTop: 16,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 8,
    marginRight: 8,
  },
  deviceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  deviceName: {
    fontSize: 16,
    flex: 1,
  },
  emptyList: {
    textAlign: 'center',
    padding: 20,
    color: '#666',
  },
});
 
export default App;
 