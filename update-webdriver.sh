# Script to update chrome webdriver, intended to be used in npm script.

chromeCmd='google-chrome'
hostOS=$(uname)
if [[ $hostOS = 'Darwin' ]];
then
  chromeCmd='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
fi
chromeVersion=$("$chromeCmd" --version | awk '{print $3}')
chromeDriverVersion=$(webdriver-manager status | grep chromedriver | awk '{print $7}')

if [[ "$chromeDriverVersion" == "$chromeVersion" ]];
then
  echo "Driver version matches chrome version: $chromeVersion"
else
  echo "Driver version mismatch, updating..."
  node ./node_modules/.bin/webdriver-manager clean
  node ./node_modules/.bin/webdriver-manager update --versions.chrome $chromeVersion
fi


