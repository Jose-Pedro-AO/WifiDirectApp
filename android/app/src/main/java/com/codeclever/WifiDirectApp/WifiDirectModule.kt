package com.codeclever.WifiDirectApp

import android.content.Context
import android.net.wifi.p2p.WifiP2pManager
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise

class WifiDirectModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    private val wifiP2pManager: WifiP2pManager by lazy {
        reactContext.getSystemService(Context.WIFI_P2P_SERVICE) as WifiP2pManager
    }
    private val channel: WifiP2pManager.Channel by lazy {
        wifiP2pManager.initialize(reactContext, reactContext.mainLooper, null)
    }

    override fun getName(): String {
        return "WifiDirectModule"
    }

    @ReactMethod
    fun startDiscovery(promise: Promise) {
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
}
