import { NextResponse } from 'next/server';

export async function GET() {
  const assetLinks = [
    {
      "relation": [
        "delegate_permission/common.handle_all_urls"
      ],
      "target": {
        "namespace": "android_app",
        "package_name": "com.vaidiktalk",
        "sha256_cert_fingerprints": [
          "DE:73:D5:39:2F:E5:28:26:CC:27:D7:B7:BC:8F:51:B0:81:81:4E:E3:74:51:BA:3F:20:0F:4D:06:41:AF:24:32"
        ]
      }
    },
    {
      "relation": ["delegate_permission/common.handle_all_urls"],
      "target": {
        "namespace": "android_app",
        "package_name": "com.vaidiktalk",
        "sha256_cert_fingerprints": [
          "FA:C6:17:45:DC:09:03:78:6F:B9:ED:E6:2A:96:2B:39:9F:73:48:F0:BB:6F:89:9B:83:32:66:75:91:03:3B:9C" 
        ]
      }
    },
    {
      "relation": ["delegate_permission/common.handle_all_urls"],
      "target": {
        "namespace": "android_app",
        "package_name": "com.vaidiktalk",
        "sha256_cert_fingerprints": [
          "D2:69:B1:2A:40:23:DF:AD:C0:F5:D0:55:E2:75:B6:EB:EA:F5:FB:BB:75:1F:B4:5C:A1:64:A9:25:FD:14:2E:85" 
        ]
      }
    }
  ];

  return NextResponse.json(assetLinks, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}