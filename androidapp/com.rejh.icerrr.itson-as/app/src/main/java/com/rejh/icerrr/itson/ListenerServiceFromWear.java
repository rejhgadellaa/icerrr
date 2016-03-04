package com.rejh.icerrr.itson;

import android.content.Intent;

import com.google.android.gms.wearable.MessageEvent;
import com.google.android.gms.wearable.WearableListenerService;

/**
 * Created by P Macw on 04-03-2016.
 */
public class ListenerServiceFromWear extends WearableListenerService {

    private static final String HELLO_WORLD_WEAR_PATH = "/hello-world-wear";

    @Override
    public void onMessageReceived(MessageEvent messageEvent) {

        /*
         * Receive the message from wear
         */
        if (messageEvent.getPath().equals(HELLO_WORLD_WEAR_PATH)) {

            Intent intent = new Intent("com.rejh.icerrr.actions.EXT_INTENT_RECEIVER");
            intent.putExtra("start_radio",true);
            sendBroadcast(intent);

        }

    }

}
