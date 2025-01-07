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
const { WifiDirectModule } = NativeModules;
const eventEmitter = new NativeEventEmitter(WifiDirectModule);

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

    return () => {
      discoveryStarted.remove();
      connectionSuccess.remove();
      messageReceived.remove();
    };
  }, []);

  // const startDiscovery = () => {
  //   WifiDirect.startDiscovery();
  // };
  // Verificação de segurança antes de chamar o método
  const requestPermissions = async () => {
    try {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        PermissionsAndroid.PERMISSIONS.NEARBY_WIFI_DEVICES,
      ]);

      return Object.values(granted).every(
        permission => permission === PermissionsAndroid.RESULTS.GRANTED
      );
    } catch (err) {
      console.warn(err);
      return false;
    }
  };

  const handleStartDiscovery = async () => {
    const hasPermissions = await requestPermissions();
    if (!hasPermissions) {
      console.error('Permissões necessárias não foram concedidas');
      return;
    }

    try {
      const result = await WifiDirectModule.startDiscovery();
      console.log('Resultado da descoberta:', result);
    } catch (error) {
      console.error('Erro ao iniciar descoberta:', error);
    }
  };

  const connectToDevice = (device: Device) => {
    setSelectedDevice(device);
    try {
      WifiDirectModule.connectToPeer(device.address);
    } catch (error) {
      console.error('Erro ao conectar ao dispositivo:', error);
    }
  };

  const sendMessage = () => {
    if (selectedDevice && currentMessage) {
      try {
        WifiDirectModule.sendMessage(currentMessage, selectedDevice.address);
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
        <Text style={styles.subtitle}>Dispositivos disponíveis:</Text>
        <FlatList
          data={devices}
          renderItem={({ item }) => (
            <Button title={item.name} onPress={() => connectToDevice(item)} />
          )}
          keyExtractor={item => item.address}
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
});

export default App;
