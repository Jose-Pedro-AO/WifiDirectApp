package com.codeclever.WifiDirectApp

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.net.wifi.p2p.WifiP2pDevice
import android.net.wifi.p2p.WifiP2pDeviceList
import android.net.wifi.p2p.WifiP2pManager
import android.net.wifi.p2p.WifiP2pConfig
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule

class WifiDirectModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    private val wifiP2pManager: WifiP2pManager by lazy {
        reactContext.getSystemService(Context.WIFI_P2P_SERVICE) as WifiP2pManager
    }
    private val channel: WifiP2pManager.Channel by lazy {
        wifiP2pManager.initialize(reactContext, reactContext.mainLooper, null)
    }

    private val peerListListener = WifiP2pManager.PeerListListener { peerList ->
        val deviceList = Arguments.createArray()
        peerList.deviceList.forEach { device ->
            val deviceMap = Arguments.createMap().apply {
                putString("name", device.deviceName)
                putString("address", device.deviceAddress)
                putString("status", device.status.toString())
            }
            deviceList.pushMap(deviceMap)
        }
        sendEvent("onPeersAvailable", deviceList)
    }

    private val receiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            when(intent?.action) {
                WifiP2pManager.WIFI_P2P_PEERS_CHANGED_ACTION -> {
                    wifiP2pManager.requestPeers(channel, peerListListener)
                }
            }
        }
    }

    init {
        val intentFilter = IntentFilter().apply {
            addAction(WifiP2pManager.WIFI_P2P_PEERS_CHANGED_ACTION)
        }
        reactContext.registerReceiver(receiver, intentFilter)
        println("WifiDirectModule: Inicializando módulo")
    }

    private fun sendEvent(eventName: String, params: WritableArray?) {
        reactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(eventName, params)
    }

    override fun getName(): String {
        println("WifiDirectModule: getName chamado - retornando 'WifiDirectModule'")
        return "WifiDirectModule"
    }

    @ReactMethod
    fun startDiscovery(promise: Promise) {
        println("WifiDirectModule: startDiscovery chamado")
        try {
            println("Iniciando descoberta de peers")
            wifiP2pManager.discoverPeers(channel, object : WifiP2pManager.ActionListener {
                override fun onSuccess() {
                    println("Descoberta iniciada com sucesso")
                    promise.resolve("Descoberta iniciada com sucesso")
                }

                override fun onFailure(reason: Int) {
                    println("Falha ao iniciar descoberta: $reason")
                    promise.reject("ERROR", "Falha ao iniciar descoberta: $reason")
                }
            })
        } catch (e: Exception) {
            println("Exceção ao iniciar descoberta: ${e.message}")
            promise.reject("ERROR", "Exceção ao iniciar descoberta: ${e.message}")
        }
    }

    @ReactMethod
    fun connectToPeer(deviceAddress: String, promise: Promise) {
        try {
            println("Tentando conectar ao dispositivo: $deviceAddress")
            val config = WifiP2pConfig().apply {
                deviceAddress = deviceAddress
            }
            
            wifiP2pManager.connect(channel, config, object : WifiP2pManager.ActionListener {
                override fun onSuccess() {
                    println("Conexão iniciada com sucesso")
                    promise.resolve("Conexão iniciada com sucesso")
                }

                override fun onFailure(reason: Int) {
                    println("Falha ao conectar: $reason")
                    promise.reject("ERROR", "Falha ao conectar: $reason")
                }
            })
        } catch (e: Exception) {
            println("Exceção ao conectar: ${e.message}")
            promise.reject("ERROR", "Exceção ao conectar: ${e.message}")
        }
    }

    @ReactMethod
    fun sendMessage(message: String, deviceAddress: String, promise: Promise) {
        try {
            // Implementar a lógica de envio de mensagem
            // Este é um exemplo básico, você precisará implementar a lógica real de socket
            println("Tentando enviar mensagem: $message para $deviceAddress")
            promise.resolve("Mensagem enviada com sucesso")
        } catch (e: Exception) {
            promise.reject("ERROR", "Falha ao enviar mensagem: ${e.message}")
        }
    }

    @ReactMethod
    fun addListener(eventName: String) {
        // Método necessário para configurar os eventos
    }

    @ReactMethod
    fun removeListeners(count: Int) {
        // Método necessário para limpar os eventos
    }

    @ReactMethod
    fun isModuleAvailable(promise: Promise) {
        try {
            println("WifiDirectModule: Verificando disponibilidade")
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERROR", "Erro ao verificar módulo: ${e.message}")
        }
    }
}
