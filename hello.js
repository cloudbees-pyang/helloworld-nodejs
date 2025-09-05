var express = require('express');
var axios = require('axios');
var app = express();

var context = process.env.CONTEXT
app.set('view engine', 'pug');
app.use(express.static('public'))
app.set('views', './views');

console.log(process.env.BUILD_NUMBER)

// Function to get user's IP address
function getUserIP(req) {
  return req.headers['x-forwarded-for'] ||
         req.headers['x-real-ip'] ||
         req.connection.remoteAddress ||
         req.socket.remoteAddress ||
         (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
         req.ip;
}

// Function to get location from IP address
async function getLocationFromIP(ip) {
  try {
    // Handle localhost/private IPs - use a public IP for demo
    if (ip === '::1' || ip === '127.0.0.1' || ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.')) {
      return {
        country: 'Unknown (Local Network)',
        region: 'Local',
        city: 'Development Environment',
        timezone: 'Local Time',
        success: true,
        note: 'This appears to be a local development environment'
      };
    }
    
    const response = await axios.get(`http://ip-api.com/json/${ip}?fields=status,message,country,regionName,city,timezone`, {
      timeout: 5000
    });
    
    if (response.data.status === 'success') {
      return {
        country: response.data.country,
        region: response.data.regionName,
        city: response.data.city,
        timezone: response.data.timezone,
        success: true
      };
    } else {
      return {
        success: false,
        error: response.data.message || 'Unable to determine location'
      };
    }
  } catch (error) {
    console.error('Error getting location:', error.message);
    // Fallback for network restrictions or API issues
    return {
      country: 'Unknown',
      region: 'Unknown',
      city: 'Unknown',
      timezone: 'Unknown',
      success: true,
      note: 'Geolocation service unavailable - showing IP only'
    };
  }
}

app.get('/', async function (req, res) {
  console.log('Hello World request.');
  
  // Get user's IP address
  const userIP = getUserIP(req);
  console.log('User IP:', userIP);
  
  // Get location information
  const locationInfo = await getLocationFromIP(userIP);
  
  // Prepare location message
  let locationMessage = '';
  if (locationInfo.success) {
    if (locationInfo.note) {
      locationMessage = `${locationInfo.note}. You are in ${locationInfo.city}, ${locationInfo.region}, ${locationInfo.country}`;
    } else {
      locationMessage = `Based on your IP (${userIP}), you appear to be located in ${locationInfo.city}, ${locationInfo.region}, ${locationInfo.country}`;
    }
  } else {
    locationMessage = `Your IP is ${userIP}, but we couldn't determine your location: ${locationInfo.error}`;
  }
  
  res.render('index', { 
    title: 'Hello', 
    message: 'Hello Worlld!', 
    name: process.env.COMMIT_AUTHOR,
    context: 'cloudbees-pyang', 
    buildNumber: process.env.BUILD_NUMBER, 
    shortCommit: process.env.SHORT_COMMIT,
    userIP: userIP,
    locationMessage: locationMessage
  })
})

app.listen(8080, function () {
   console.log('Example app listening on port 8080!');
});
