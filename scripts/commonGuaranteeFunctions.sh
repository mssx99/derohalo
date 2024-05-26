function guarantee_deposit() {
    # WalletPort, Scid, Amount 
	curl --silent http://127.0.0.1:$1/json_rpc -d '{"jsonrpc":"2.0","id":"0","method":"scinvoke","params":{"sc_dero_deposit":'"$3"',"scid":"'"$2"'","ringsize":2, "sc_rpc":[{"name":"entrypoint","datatype":"S","value":"Deposit"}] }}' -H 'Content-Type: application/json' | jq -r ".result.txid"
}

function guarantee_withdrawal() {
    # WalletPort, Scid, account/amount
    transactions='{"name":"entrypoint","datatype":"S","value":"Withdrawal"}'
	curl --silent http://127.0.0.1:$1/json_rpc -d '{"jsonrpc":"2.0","id":"0","method":"scinvoke","params":{"sc_dero_deposit":'"$totalAmount"',"scid":"'"$2"'","ringsize":2, "sc_rpc":['$transactions'] }}' -H 'Content-Type: application/json' | jq -r ".result.txid"
}

function guarantee_getState() {
    # Scid
    hex_to_ascii $(curl --silent http://127.0.0.1:$daemon_rpc_port/json_rpc -d '{"jsonrpc":"2.0","id":"0","method":"DERO.GetSC","params":{"scid":"'"$1"'","keysstring":["State"] }}' -H 'Content-Type: application/json' | jq -r ".result.valuesstring[0]")
}

function guarantee_approve() {
    # WalletPort, Scid, Stage
    curl --silent http://127.0.0.1:$1/json_rpc -d '{"jsonrpc":"2.0","id":"0","method":"scinvoke","params":{"scid":"'"$2"'","ringsize":2, "sc_rpc":[{"name":"entrypoint","datatype":"S","value":"Approve"},{"name":"stage","datatype":"U","value":'$3'}] }}' -H 'Content-Type: application/json' | jq -r ".result.txid"
}

function guarantee_resetVote() {
    # WalletPort, Scid, Stage
    curl --silent http://127.0.0.1:$1/json_rpc -d '{"jsonrpc":"2.0","id":"0","method":"scinvoke","params":{"scid":"'"$2"'","ringsize":2, "sc_rpc":[{"name":"entrypoint","datatype":"S","value":"ResetVote"},{"name":"stage","datatype":"U","value":'$3'}] }}' -H 'Content-Type: application/json' | jq -r ".result.txid"
}

# Install and testing routines

paintSeparator

echo -n "Registering Guarantee-Example: "
response=$(curl --silent --request POST --data-binary @$CURDIR/contracts/$contractGuaranteeExample http://127.0.0.1:$user0_rpc_port/install_sc)
contractGuaranteeExampleScid=$(echo $response | jq -r ".txid")
echo $contractGuaranteeExampleScid
sleep 5

partyAport=30001
partyBport=30003

echo "Parties entering"
fundingPartyA=$(guarantee_deposit $partyAport $contractGuaranteeExampleScid 70800)
echo "Party A funded: "$fundingPartyA
fundingPartyB=$(guarantee_deposit $partyBport $contractGuaranteeExampleScid 210000)
echo "Party B funded: "$fundingPartyB

sleep 2

derobalance=$(scbalance $contractGuaranteeExampleScid)
echo "SmartContract dero balance="$derobalance" (should be: 280800)"

currentState=$(guarantee_getState $contractGuaranteeExampleScid)

echo "Current State: "$currentState

paintSmallSeparator

echo "Approving Stage 1"
stage1Approval_A=$(guarantee_approve $partyAport $contractGuaranteeExampleScid 1)
echo "Party A approved stage 1: "$stage1Approval_A
stage1Approval_B=$(guarantee_approve $partyBport $contractGuaranteeExampleScid 1)
echo "Party B approved stage 1: "$stage1Approval_B

sleep 1

derobalance=$(scbalance $contractGuaranteeExampleScid)
echo "SmartContract dero balance="$derobalance" (should be: 240400)"

paintSmallSeparator

echo "Approving Stage 2"
stage1Approval_B=$(guarantee_approve $partyBport $contractGuaranteeExampleScid 2)
echo "Party B approved stage 2: "$stage1Approval_B

echo "Approving Stage 3"
stage1Approval_A=$(guarantee_approve $partyAport $contractGuaranteeExampleScid 3)
echo "Party A approved stage 3: "$stage1Approval_A

sleep 1

derobalance=$(scbalance $contractGuaranteeExampleScid)
echo "SmartContract dero balance="$derobalance" (should be: 240400)"

paintSmallSeparator

echo "Approving Stage 4"
stage1Approval_A=$(guarantee_approve $partyAport $contractGuaranteeExampleScid 4)
echo "Party A approved stage 4: "$stage1Approval_A

echo "Approving Stage 5"
stage5Approval_A=$(guarantee_approve $partyAport $contractGuaranteeExampleScid 5)
echo "Party A approved stage 5: "$stage5Approval_A

sleep 2

derobalance=$(scbalance $contractGuaranteeExampleScid)
echo "SmartContract dero balance="$derobalance" (should be: 240400)"

paintSmallSeparator

echo "Party A resets Vote for Stage 4"
stage4ResetVote_A=$(guarantee_resetVote $partyAport $contractGuaranteeExampleScid 4)
echo "Party A resetVote stage 4: "$stage4ResetVote_A

sleep 2

derobalance=$(scbalance $contractGuaranteeExampleScid)
echo "SmartContract dero balance="$derobalance" (should be: 240400)"

paintSmallSeparator

stage4Approval_B=$(guarantee_approve $partyBport $contractGuaranteeExampleScid 4)
echo "Party B approving stage 4: "$stage4Approval_B

sleep 2

derobalance=$(scbalance $contractGuaranteeExampleScid)
echo "SmartContract dero balance="$derobalance" (should be: 240400)"

