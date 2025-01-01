package com.wifidirectexample

import android.content.Context
import android.net.wifi.p2p.WifiP2pConfig
import android.net.wifi.p2p.WifiP2pManager
import android.os.Looper
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule

class WifiDirectModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    private val mManager: WifiP2pManager? =
        reactContext.getSystemService(Context.WIFI_P2P_SERVICE) as WifiP2pManager?
    private val mChannel: WifiP2pManager.Channel? =
        mManager?.initialize(reactContext, Looper.getMainLooper(), null)

    override fun getName(): String {
        return "WifiDirect"
    }

    @ReactMethod
    fun startDiscovery() {
        mManager?.discoverPeers(mChannel, object : WifiP2pManager.ActionListener {
            override fun onSuccess() {
                sendEvent("onDiscoveryStarted", null)
            }

            override fun onFailure(reasonCode: Int) {
                sendEvent("onDiscoveryFailed", createErrorMap(reasonCode))
            }
        })
    }

    @ReactMethod
    fun connectToPeer(deviceAddress: String) {
        val config = WifiP2pConfig().apply {
            this.deviceAddress = deviceAddress
        }

        mManager?.connect(mChannel, config, object : WifiP2pManager.ActionListener {
            override fun onSuccess() {
                sendEvent("onConnectionSuccess", null)
            }

            override fun onFailure(reasonCode: Int) {
                sendEvent("onConnectionFailed", createErrorMap(reasonCode))
            }
        })
    }

    @ReactMethod
    fun sendMessage(message: String, deviceAddress: String) {
        // Implementação do envio de mensagem via sockets
        // Este é um exemplo simplificado - você precisará implementar
        // a lógica real de sockets aqui
    }

    private fun sendEvent(eventName: String, params: WritableMap?) {
        reactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(eventName, params)
    }

    private fun createErrorMap(reasonCode: Int): WritableMap {
        return Arguments.createMap().apply {
            putInt("code", reasonCode)
        }
    }
}
