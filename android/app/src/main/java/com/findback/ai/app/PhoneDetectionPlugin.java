package com.findback.ai.app;

import android.Manifest;
import android.content.Context;
import android.content.pm.PackageManager;
import android.telephony.SubscriptionInfo;
import android.telephony.SubscriptionManager;
import android.telephony.TelephonyManager;
import androidx.core.app.ActivityCompat;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import java.util.List;

@CapacitorPlugin(
    name = "PhoneDetection",
    permissions = {
        @Permission(
            strings = {Manifest.permission.READ_PHONE_STATE, Manifest.permission.READ_PHONE_NUMBERS},
            alias = "phone"
        )
    }
)
public class PhoneDetectionPlugin extends Plugin {

    @PluginMethod
    public void getSimPhoneNumber(PluginCall call) {
        if (!hasRequiredPermissions()) {
            requestPermissionForAlias("phone", call, "phonePermissionCallback");
        } else {
            fetchPhoneNumbers(call);
        }
    }

    @PermissionCallback
    private void phonePermissionCallback(PluginCall call) {
        if (hasRequiredPermissions()) {
            fetchPhoneNumbers(call);
        } else {
            JSObject result = new JSObject();
            result.put("success", false);
            result.put("message", "Permission to read phone numbers/SIM state was denied");
            call.resolve(result);
        }
    }

    private void fetchPhoneNumbers(PluginCall call) {
        try {
            Context context = getContext();
            JSObject result = new JSObject();
            String phoneNumber = null;

            // 1. Try SubscriptionManager (Multi-SIM support)
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.LOLLIPOP_MR1) {
                SubscriptionManager subscriptionManager = (SubscriptionManager) context.getSystemService(Context.TELEPHONY_SUBSCRIPTION_SERVICE);
                if (subscriptionManager != null) {
                    if (ActivityCompat.checkSelfPermission(context, Manifest.permission.READ_PHONE_STATE) == PackageManager.PERMISSION_GRANTED ||
                        ActivityCompat.checkSelfPermission(context, Manifest.permission.READ_PHONE_NUMBERS) == PackageManager.PERMISSION_GRANTED) {
                        List<SubscriptionInfo> subscriptionInfoList = subscriptionManager.getActiveSubscriptionInfoList();
                        if (subscriptionInfoList != null) {
                            for (SubscriptionInfo info : subscriptionInfoList) {
                                CharSequence number = info.getNumber();
                                if (number != null && !number.toString().trim().isEmpty()) {
                                    phoneNumber = number.toString().trim();
                                    break;
                                }
                            }
                        }
                    }
                }
            }

            // 2. Fallback to TelephonyManager line1 number
            if (phoneNumber == null || phoneNumber.isEmpty()) {
                TelephonyManager telephonyManager = (TelephonyManager) context.getSystemService(Context.TELEPHONY_SERVICE);
                if (telephonyManager != null) {
                    if (ActivityCompat.checkSelfPermission(context, Manifest.permission.READ_PHONE_NUMBERS) == PackageManager.PERMISSION_GRANTED ||
                        ActivityCompat.checkSelfPermission(context, Manifest.permission.READ_PHONE_STATE) == PackageManager.PERMISSION_GRANTED) {
                        phoneNumber = telephonyManager.getLine1Number();
                    }
                }
            }

            if (phoneNumber != null && !phoneNumber.trim().isEmpty()) {
                result.put("success", true);
                result.put("phoneNumber", phoneNumber.trim());
                call.resolve(result);
            } else {
                result.put("success", false);
                result.put("message", "No SIM phone number provisioned directly on SIM chip. Please enter phone number manually.");
                call.resolve(result);
            }
        } catch (Exception e) {
            JSObject result = new JSObject();
            result.put("success", false);
            result.put("message", "Error querying device SIM state: " + e.getMessage());
            call.resolve(result);
        }
    }
}
