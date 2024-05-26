#!/bin/bash

read -e -p "Please enter required credential: " -i "username:password" credentials 

unset GTK_PATH # --window --maximize

gnome-terminal --working-directory="DeroSource/xswd/derohe/build/dero_linux_amd64/" -- bash -c "./dero-wallet-cli-linux-amd64 --daemon 'node.derofoundation.org:11012' --rpc-server --rpc-login '"$credentials"'" 
sleep 10