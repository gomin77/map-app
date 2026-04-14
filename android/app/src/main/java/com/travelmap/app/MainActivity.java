package com.travelmap.app;

import com.getcapacitor.BridgeActivity;
import android.os.Bundle;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.content.pm.Signature;
import android.content.pm.SigningInfo;
import android.util.Base64;
import android.util.Log;
import java.security.MessageDigest;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        printKeyHash();
    }

    private void printKeyHash() {
        try {
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.P) {
                // Android 9 이상: 새 API 사용
                PackageInfo info = getPackageManager().getPackageInfo(
                    getPackageName(), PackageManager.GET_SIGNING_CERTIFICATES);
                SigningInfo signingInfo = info.signingInfo;
                Signature[] signatures;
                if (signingInfo.hasMultipleSigners()) {
                    signatures = signingInfo.getApkContentsSigners();
                } else {
                    signatures = signingInfo.getSigningCertificateHistory();
                }
                for (Signature sig : signatures) {
                    MessageDigest md = MessageDigest.getInstance("SHA");
                    md.update(sig.toByteArray());
                    String keyHash = Base64.encodeToString(md.digest(), Base64.NO_WRAP);
                    Log.d("KAKAO_KEYHASH", "KeyHash (API28+): [" + keyHash + "]");
                }
            } else {
                // Android 9 미만: 구 API 사용
                PackageInfo info = getPackageManager().getPackageInfo(
                    getPackageName(), PackageManager.GET_SIGNATURES);
                for (Signature sig : info.signatures) {
                    MessageDigest md = MessageDigest.getInstance("SHA");
                    md.update(sig.toByteArray());
                    String keyHash = Base64.encodeToString(md.digest(), Base64.NO_WRAP);
                    Log.d("KAKAO_KEYHASH", "KeyHash (legacy): [" + keyHash + "]");
                }
            }
        } catch (Exception e) {
            Log.e("KAKAO_KEYHASH", "Error: " + e.getMessage());
        }
    }
}
