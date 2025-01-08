package com.wifidirectexample

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.net.wifi.p2p.WifiP2pDeviceList
import android.net.wifi.p2p.WifiP2pManager

class WifiDirectBroadcastReceiver(
    private val mManager: WifiP2pManager?,
    private val mChannel: WifiP2pManager.Channel?,
    private val mModule: WifiDirectModule
) : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        val action = intent.action 

        when (action) {
            WifiP2pManager.WIFI_P2P_STATE_CHANGED_ACTION -> {
                // Verifica se Wi-Fi P2P está habilitado
            }
            WifiP2pManager.WIFI_P2P_PEERS_CHANGED_ACTION -> {
                // Dispositivos disponíveis mudaram
                mManager?.requestPeers(mChannel) { peers: WifiP2pDeviceList ->
                    // Atualiza lista de peers
                }
            }
            WifiP2pManager.WIFI_P2P_CONNECTION_CHANGED_ACTION -> {
                // Estado da conexão mudou
            }
        }
    }
}
