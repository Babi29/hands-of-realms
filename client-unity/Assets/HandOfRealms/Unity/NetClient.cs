// Connexion WebSocket au serveur de jeu (paquet NativeWebSocket, compatible WebGL et mobile).
using System;
using System.Collections.Generic;
using System.Text;
using HandOfRealms.Core;
using NativeWebSocket;
using UnityEngine;

namespace HandOfRealms
{
    public class NetClient : MonoBehaviour
    {
        WebSocket _ws;
        public event Action<ServerMessage> Received;
        public event Action<string> StatusChanged;
        public bool Connected => _ws != null && _ws.State == WebSocketState.Open;

        public async void Connect(string url, string joinMessage)
        {
            if (_ws != null) await _ws.Close();
            _ws = new WebSocket(url);
            _ws.OnOpen += () => { StatusChanged?.Invoke("Connecté"); _ = _ws.SendText(joinMessage); };
            _ws.OnError += e => StatusChanged?.Invoke("Erreur réseau : " + e);
            _ws.OnClose += code => StatusChanged?.Invoke("Déconnecté (" + code + ")");
            _ws.OnMessage += bytes =>
            {
                ServerMessage msg;
                try { msg = ServerMessage.Parse(Encoding.UTF8.GetString(bytes)); }
                catch (Exception e) { Debug.LogWarning("Message illisible : " + e.Message); return; }
                Received?.Invoke(msg);
            };
            StatusChanged?.Invoke("Connexion à " + url + "…");
            await _ws.Connect();
        }

        public void Send(string json)
        {
            if (json == null || !Connected) return;
            _ = _ws.SendText(json);
        }

        void Update()
        {
#if !UNITY_WEBGL || UNITY_EDITOR
            _ws?.DispatchMessageQueue();
#endif
        }

        async void OnApplicationQuit()
        {
            if (_ws != null) await _ws.Close();
        }
    }
}
