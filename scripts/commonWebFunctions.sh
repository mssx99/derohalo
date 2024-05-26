# Admin Options

function webWithdraw() {
    # WalletPort, Scid, Amount
	curl --silent http://127.0.0.1:$1/json_rpc -d '{"jsonrpc":"2.0","id":"0","method":"scinvoke","params":{"scid":"'"$2"'","ringsize":2, "sc_rpc":[{"name":"entrypoint","datatype":"S","value":"Withdraw"},{"name":"amount","datatype":"U","value":'$3'}] }}' -H 'Content-Type: application/json' | jq -r ".result.txid"
}

function approveListing() {
    # WalletPort, Scid, listingKey
    curl --silent http://127.0.0.1:$1/json_rpc -d '{"jsonrpc":"2.0","id":"0","method":"scinvoke","params":{"scid":"'"$2"'","ringsize":2, "sc_rpc":[{"name":"entrypoint","datatype":"S","value":"ApproveListing"},{"name":"listingKey","datatype":"S","value":"'$3'"}] }}' -H 'Content-Type: application/json' | jq -r ".result.txid"
}

function rejectListing() {
    # WalletPort, Scid, listingKey
    curl --silent http://127.0.0.1:$1/json_rpc -d '{"jsonrpc":"2.0","id":"0","method":"scinvoke","params":{"scid":"'"$2"'","ringsize":2, "sc_rpc":[{"name":"entrypoint","datatype":"S","value":"ReturnMoneyAndRemove"},{"name":"listingKey","datatype":"S","value":"'$3'"}] }}' -H 'Content-Type: application/json' | jq -r ".result.txid"
}

function configureWebContract() {
    # WalletPort, Scid, name, description, chatPublishFee, chatPublishFeeMinimum, guaranteePublishFee, guaranteePublishFeeMinimum, guaranteeApprovalRequiredBeforePublishing, guaranteeBlockPackageSize, guaranteeBlockPackagePrice
    curl --silent http://127.0.0.1:$1/json_rpc -d '{"jsonrpc":"2.0","id":"0","method":"scinvoke","params":{"scid":"'"$2"'","ringsize":2, "sc_rpc":[{"name":"entrypoint","datatype":"S","value":"Configure"},{"name":"name","datatype":"S","value":"'$3'"},{"name":"description","datatype":"S","value":"'$4'"},{"name":"chatPublishFee","datatype":"U","value":'$5'},{"name":"chatPublishFeeMinimum","datatype":"U","value":'$6'},{"name":"guaranteePublishFee","datatype":"U","value":'$7'},{"name":"guaranteePublishFeeMinimum","datatype":"U","value":'$8'},{"name":"guaranteeApprovalRequiredBeforePublishing","datatype":"U","value":'$9'},{"name":"guaranteeBlockPackageSize","datatype":"U","value":'${10}'},{"name":"guaranteeBlockPackagePrice","datatype":"U","value":'${11}'}] }}' -H 'Content-Type: application/json' | jq -r ".result.txid"
}

# User Options

function publishGuarantee() {
    # WalletPort, WebScid, fee GuaranteeScid, market, packages, guaranteeAmount
    curl --silent http://127.0.0.1:$1/json_rpc -d '{"jsonrpc":"2.0","id":"0","method":"scinvoke","params":{"scid":"'$2'","sc_dero_deposit":'$3',"ringsize":2, "sc_rpc":[{"name":"entrypoint","datatype":"S","value":"PublishToMarket"},{"name":"scid","datatype":"S","value":"'$4'"},{"name":"market","datatype":"S","value":"'$5'"},{"name":"packages","datatype":"U","value":'$6'},{"name":"guaranteeAmount","datatype":"U","value":'$7'}] }}' -H 'Content-Type: application/json' | jq -r ".result.txid"
    # set -x
    # curl http://127.0.0.1:$1/json_rpc -d '{"jsonrpc":"2.0","id":"0","method":"scinvoke","params":{"scid":"'$2'","sc_dero_deposit":'$3',"ringsize":2, "sc_rpc":[{"name":"entrypoint","datatype":"S","value":"PublishToMarket"},{"name":"scid","datatype":"S","value":"'$4'"},{"name":"market","datatype":"S","value":"'$5'"},{"name":"packages","datatype":"U","value":'$6'},{"name":"guaranteeAmount","datatype":"U","value":'$7'}] }}' -H 'Content-Type: application/json'
    # | jq -r ".result.txid"
    # set +x
}

# function extendGuarantee() {

# }

# function removeGuarantee() {

# }

function publishMinimumForChat() {
    # WalletPort, Scid, Fee, chatMinimum, alias, description, destAccount
    curl --silent http://127.0.0.1:$1/json_rpc -d '{"jsonrpc":"2.0","id":"0","method":"scinvoke","params":{"sc_dero_deposit":'$3',"scid":"'$2'","ringsize":2, "sc_rpc":[{"name":"entrypoint","datatype":"S","value":"PublishChatMinimum"},{"name":"chatMinimum","datatype":"U","value":'$4'},{"name":"alias","datatype":"S","value":"'$5'"},{"name":"description","datatype":"S","value":"'$6'"},{"name":"destAccount","datatype":"S","value":"'$7'"}] }}' -H 'Content-Type: application/json' | jq -r ".result.txid"
}

function deleteMinimumForChat() {
    # WalletPort, Scid, destAccount
    curl --silent http://127.0.0.1:$1/json_rpc -d '{"jsonrpc":"2.0","id":"0","method":"scinvoke","params":{"scid":"'$2'","ringsize":2, "sc_rpc":[{"name":"entrypoint","datatype":"S","value":"DeleteChatMinimum"},{"name":"destAccount","datatype":"S","value":"'$3'"}] }}' -H 'Content-Type: application/json' | jq -r ".result.txid"
}

# Install and testing routines

paintSeparator

echo -n "Registering Web-Example: "
response=$(curl --silent --request POST --data-binary @$CURDIR/contracts/$contractWebExample http://127.0.0.1:$owner_rpc_port/install_sc)
contractWebExampleScid=$(echo $response | jq -r ".txid")
echo $contractWebExampleScid
sleep 5

echo -n "Configuring Web Contract: "
configureTrans=$(configureWebContract $owner_rpc_port $contractWebExampleScid "TestContract" "JustForTesting..." 10000010001 0 10000010001 0 1 2000 50000)
echo $configureTrans

sleep 2

echo -n "Publish Chat Minimum for User 1: "
chatMinOwnerTrans=$(publishMinimumForChat $owner_rpc_port $contractWebExampleScid 10000 20 "Carol" "madness")
echo $chatMinOwnerTrans

sleep 2

echo -n "Publish Chat Minimum for User 1 for Conversation with "$userAddress0": "
chatMinOwnerTrans=$(publishMinimumForChat $owner_rpc_port $contractWebExampleScid 15000 21 "Honey" "Theworldspinstoinfinity" "$userAddress0")
echo $chatMinOwnerTrans

sleep 2

echo -n "Publish Chat Minimum for User 2: "
chatMinOwnerTrans=$(publishMinimumForChat $user1_rpc_port $contractWebExampleScid 80000 22 "M" "rainbowColors")
echo $chatMinOwnerTrans

echo -n "Publish Chat Minimum for User 3: "
chatMinOwnerTrans=$(publishMinimumForChat $user2_rpc_port $contractWebExampleScid 1000 23 "Carol" "letGo")
echo $chatMinOwnerTrans

sleep 2

echo -n "Change Chat Minimum for User 2: "
chatMinOwnerTrans=$(publishMinimumForChat $user1_rpc_port $contractWebExampleScid 10500 45 "M" "rainbowColorsXXX")
echo $chatMinOwnerTrans

echo -n "Delete Chat Minimum for User 1: "
deleteChatMinOwnerTrans=$(deleteMinimumForChat $owner_rpc_port $contractWebExampleScid)
echo $deleteChatMinOwnerTrans

sleep 2

paintSeparator

echo -n "Withdraw: "
withdrawTrans=$(webWithdraw $owner_rpc_port $contractWebExampleScid 40000)
echo $withdrawTrans

paintSeparator

# $guaranteeScid=57c2fff793f4c55b9e9bdb3d3291e8445b9651e09dd746f65b33af8fa138e191

echo -n "Publish Guarantee to Market: "
publishTrans=$(publishGuarantee $user0_rpc_port $contractWebExampleScid 260000 $contractGuaranteeExampleScid "superMarket" 5 280800)
echo $publishTrans