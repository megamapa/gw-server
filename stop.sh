echo "Terminando GW-Server."
kill $(cat gw-server.pid 2>/dev/null) 2>/dev/null
if [ $? -eq 0 ]; then while [ -f "gw-server.pid" ]; do sleep 1; done; fi;
rm -f gw-server.pid 2>/dev/null
echo "GW-server terminado."