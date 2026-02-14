import { NextResponse } from 'next/server';

export async function GET() {
  const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>VaidikTalk Support</title>
    <style>
        body, html { 
            margin: 0; 
            padding: 0; 
            height: 100%; 
            overflow: hidden;
            background-color: #fff; /* Ensure white background */
        }
        #zsiq_float {
            display: none !important;
        }
    </style>
</head>
<body>
    <script>
        window.$zoho = window.$zoho || {};
        $zoho.salesiq = $zoho.salesiq || {
            widgetcode: "siq80a3bbe2c971736e0ef6d8515cf0b1079dbba0b03777d497302851d328cb1719",
            values: {},
            ready: function() {
                console.log('✅ Zoho Ready for VaidikTalk Support');
                
                // Auto-show chat
                $zoho.salesiq.floatwindow.visible('show');
                $zoho.salesiq.chat.start();
                
                // Listen for user data from React Native
                window.addEventListener('message', function(event) {
                    try {
                        // Handle both string and object data
                        const rawData = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
                        // If data was double-stringified (common in WebViews), parse again
                        const data = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;

                        // ========================================
                        // ASTROLOGER SUPPORT
                        // ========================================
                        if (data.type === 'SET_ASTROLOGER_INFO') {
                            const a = data.astrologer;
                            console.log('📝 Setting ASTROLOGER:', a.name);
                            
                            if (a.name) $zoho.salesiq.visitor.name("🔮 " + a.name);
                            if (a.email) $zoho.salesiq.visitor.email(a.email);
                            if (a.phoneNumber) $zoho.salesiq.visitor.contactnumber(a.phoneNumber);
                            
                            $zoho.salesiq.visitor.info({
                                "User Type": "🔮 ASTROLOGER",
                                "ID": a._id || 'unknown',
                                "Experience": (a.experienceYears || 0) + " years",
                                "Account Status": a.accountStatus || 'active',
                                "Platform": "Astrologer App (React Native)"
                            });
                            
                            $zoho.salesiq.visitor.addtag("astrologer");
                        }
                        
                        // ========================================
                        // USER SUPPORT
                        // ========================================
                        else if (data.type === 'SET_USER_INFO') {
                            const u = data.user;
                            console.log('📝 Setting USER:', u.name);
                            
                            if (u.name) $zoho.salesiq.visitor.name("👤 " + u.name);
                            if (u.email) $zoho.salesiq.visitor.email(u.email);
                            if (u.phoneNumber) $zoho.salesiq.visitor.contactnumber(u.phoneNumber);
                            
                            $zoho.salesiq.visitor.info({
                                "User Type": "👤 USER",
                                "ID": u._id || 'unknown',
                                "Wallet Balance": "₹" + (u.wallet?.balance || 0),
                                "Platform": "User App (React Native)"
                            });
                            
                            $zoho.salesiq.visitor.addtag("user");
                        }
                        
                    } catch (error) {
                        console.error('❌ Error parsing message:', error);
                    }
                });
                
                console.log('👂 Listening for user/astrologer data...');
            }
        };
    </script>
    <script 
        id="zsiqscript" 
        src="https://salesiq.zoho.in/widget?wc=siq80a3bbe2c971736e0ef6d8515cf0b1079dbba0b03777d497302851d328cb1719" 
        defer
    ></script>
</body>
</html>
  `;

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html',
    },
  });
}