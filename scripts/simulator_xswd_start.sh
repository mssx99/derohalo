#!/bin/bash

temp_dir=$(mktemp -d)

echo "Created TempDir: $temp_dir"
cp public/Downloads/simulator-linux-amd64 "$temp_dir/"

unset GTK_PATH # --window --maximize
gnome-terminal --window --maximize --working-directory="$temp_dir" -- bash -c "trap read ERR; $temp_dir/simulator-linux-amd64 --use-xswd; echo 'Press enter to exit'; read"
sleep 80

source ./scripts/commonFunctions.sh

contractMultiSigExample=MultiSig.bas
contractGuaranteeExample=Guarantee.bas
contractWebExample=Web.bas

daemon_rpc_port="20000"
owner_rpc_port="30000"
user0_rpc_port="30001"
user1_rpc_port="30002"
user2_rpc_port="30003"
user3_rpc_port="30004"

username0="caroline"
username1="johnny"
username2="child1"
username3="child2"

userAddress0=$(walletAddress $user0_rpc_port)
userAddress1=$(walletAddress $user1_rpc_port)
userAddress2=$(walletAddress $user2_rpc_port)
userAddress3=$(walletAddress $user3_rpc_port)

registerName $user0_rpc_port $username0
registerName $user1_rpc_port $username1
registerName $user2_rpc_port $username2
registerName $user3_rpc_port $username3

sleep 2

source ./scripts/commonMultiSigFunctions.sh
source ./scripts/commonGuaranteeFunctions.sh
source ./scripts/commonWebFunctions.sh

paintSeparator
echo -e "\n\n"

randomAddress=$(randomAddress)
echo "Random Address: "$randomAddress

printf "REACT_APP_ADDRESS_CAROLINE="$userAddress0"\nREACT_APP_ADDRESS_JOHNNY="$userAddress1"\nREACT_APP_ADDRESS_CHILD1="$userAddress2"\nREACT_APP_ADDRESS_CHILD2="$userAddress3"\nREACT_APP_MULTISIG_SC="$contractMultiSigExampleScid"\nREACT_APP_GUARANTEE_SC="$contractGuaranteeExampleScid"\nREACT_APP_WEB_SC="$contractWebExampleScid"\nREACT_APP_GHOST_ACCOUNT="$randomAddress > ".env.development"

