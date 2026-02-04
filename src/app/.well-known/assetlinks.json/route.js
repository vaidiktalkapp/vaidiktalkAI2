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
    }
  ];

  return NextResponse.json(assetLinks, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}