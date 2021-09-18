googleCmd='google-chrome'
hostOS=$(uname)
if [[ $hostOS = 'Darwin' ]];
then
  googleCmd='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
fi
chromeVersion=$("$googleCmd" --version | awk '{print $3}')
chromeDriverVersion=$(webdriver-manager status | grep chromedriver | awk '{print $7}')

if [[ "$chromeDriverVersion" == "$chromeVersion" ]];
then
  echo "Driver version matches chrome version: $chromeVersion"
else
  echo "Driver version mismatch, updating..."
  node ./node_modules/.bin/webdriver-manager clean
  node ./node_modules/.bin/webdriver-manager update --versions.chrome $chromeVersion
fi


