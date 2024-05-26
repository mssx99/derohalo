#!/bin/bash

read -e -p "Please enter required credential: " -i "username:password" credentials 

unset GTK_PATH # --window --maximize
gnome-terminal --window --maximize --working-directory="DeroSource/DeroSourceCode/mainnet/" -- bash -c "./derod-linux-amd64"
sleep 5
gnome-terminal --working-directory="DeroSource/DeroSourceCode/mainnet/" -- bash -c "./dero-wallet-cli-linux-amd64 --rpc-server --rpc-login '"$credentials"'" 
sleep 10