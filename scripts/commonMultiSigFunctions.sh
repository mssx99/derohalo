function deposit() {
    # WalletPort, Scid, Amount 
	curl --silent http://127.0.0.1:$1/json_rpc -d '{"jsonrpc":"2.0","id":"0","method":"scinvoke","params":{"sc_dero_deposit":'"$3"',"scid":"'"$2"'","ringsize":2, "sc_rpc":[{"name":"entrypoint","datatype":"S","value":"Deposit"}] }}' -H 'Content-Type: application/json' | jq -r ".result.txid"
}

function proposeWithdrawal() {
    # WalletPort, Scid, maxTransactions, array of transactions. account/amount
    transactions='{"name":"entrypoint","datatype":"S","value":"ProposeWithdrawal"}'
    numTransactions=$((($#-3)/2))
    maxTransactions=$3
    emptyTransactions=$((maxTransactions-numTransactions))
    totalAmount=0
    for ((i = 4,x=0; i <= $#; i+=2,x++)); do
        account=${!i}
        n=$((i+1))
        amount=${!n}
        totalAmount=$((totalAmount+amount))
        transactions+=',{"name":"account'$x'","datatype":"S","value":"'$account'"},{"name":"amount'$x'","datatype":"U","value":'$amount'}'
    done
    for ((i = numTransactions; i < maxTransactions; i++)); do
        transactions+=',{"name":"account'$i'","datatype":"S","value":""},{"name":"amount'$i'","datatype":"U","value":0}'
    done

    # echo '{"jsonrpc":"2.0","id":"0","method":"scinvoke","params":{"sc_dero_deposit":'"$totalAmount"',"scid":"'"$2"'","ringsize":2, "sc_rpc":['$transactions'] }}'
	curl --silent http://127.0.0.1:$1/json_rpc -d '{"jsonrpc":"2.0","id":"0","method":"scinvoke","params":{"sc_dero_deposit":'"$totalAmount"',"scid":"'"$2"'","ringsize":2, "sc_rpc":['$transactions'] }}' -H 'Content-Type: application/json' | jq -r ".result.txid"
}

function getAtomicId() {
    # Scid, Txid
    search="TransRegister_"$2

    # echo '{"jsonrpc":"2.0","id":"0","method":"DERO.GetSC","params":{"scid":"'"$1"'","keysstring":["'"$search"'"] }}'
    curl --silent http://127.0.0.1:$daemon_rpc_port/json_rpc -d '{"jsonrpc":"2.0","id":"0","method":"DERO.GetSC","params":{"scid":"'"$1"'","keysstring":["'"$search"'"] }}' -H 'Content-Type: application/json' | jq -r ".result.valuesstring[0]"
}

function approveTransaction() {
    # WalletPort, Scid, AtomicId
    curl --silent http://127.0.0.1:$1/json_rpc -d '{"jsonrpc":"2.0","id":"0","method":"scinvoke","params":{"scid":"'"$2"'","ringsize":2, "sc_rpc":[{"name":"entrypoint","datatype":"S","value":"ApproveVote"},{"name":"atomicId","datatype":"U","value":'$3'}] }}' -H 'Content-Type: application/json' | jq -r ".result.txid"
}

function resetTransaction() {
    # WalletPort, Scid, AtomicId
    curl --silent http://127.0.0.1:$1/json_rpc -d '{"jsonrpc":"2.0","id":"0","method":"scinvoke","params":{"scid":"'"$2"'","ringsize":2, "sc_rpc":[{"name":"entrypoint","datatype":"S","value":"ResetVote"},{"name":"atomicId","datatype":"U","value":'$3'}] }}' -H 'Content-Type: application/json' | jq -r ".result.txid"
}

function rejectTransaction() {
    # WalletPort, Scid, AtomicId
    curl --silent http://127.0.0.1:$1/json_rpc -d '{"jsonrpc":"2.0","id":"0","method":"scinvoke","params":{"scid":"'"$2"'","ringsize":2, "sc_rpc":[{"name":"entrypoint","datatype":"S","value":"RejectVote"},{"name":"atomicId","datatype":"U","value":'$3'}] }}' -H 'Content-Type: application/json' | jq -r ".result.txid"
}

function getTransactionState() {
    # Scid, AtomicId
    search="TransState_"$2

    hexResponse=$(curl --silent http://127.0.0.1:$daemon_rpc_port/json_rpc -d '{"jsonrpc":"2.0","id":"0","method":"DERO.GetSC","params":{"scid":"'"$1"'","keysstring":["'"$search"'"] }}' -H 'Content-Type: application/json' | jq -r ".result.valuesstring[0]")
    hex_to_ascii $hexResponse
}

function cancelWithdrawal() {
    # WalletPort, Scid, AtomicId
    curl --silent http://127.0.0.1:$1/json_rpc -d '{"jsonrpc":"2.0","id":"0","method":"scinvoke","params":{"scid":"'"$2"'","ringsize":2, "sc_rpc":[{"name":"entrypoint","datatype":"S","value":"CancelWithdrawal"},{"name":"atomicId","datatype":"U","value":'$3'}] }}' -H 'Content-Type: application/json' | jq -r ".result.txid"
}

# Install and testing routines

paintSeparator
echo -n "Registering MultiSigExample: "
response=$(curl --silent --request POST --data-binary @$CURDIR/contracts/$contractMultiSigExample http://127.0.0.1:$user0_rpc_port/install_sc)
contractMultiSigExampleScid=$(echo $response | jq -r ".txid")
echo $contractMultiSigExampleScid
sleep 5

echo "Funding Multisig"
fundingTxid0=$(deposit $user0_rpc_port $contractMultiSigExampleScid 75000)
echo $fundingTxid0
fundingTxid1=$(deposit $user1_rpc_port $contractMultiSigExampleScid 75000)
echo $fundingTxid1
fundingTxid2=$(deposit $user2_rpc_port $contractMultiSigExampleScid 75000)
echo $fundingTxid2
fundingTxid3=$(deposit $user3_rpc_port $contractMultiSigExampleScid 75000)
echo $fundingTxid3

paintSmallSeparator

# Proposal 1: 2 out of 3 are required to approve if Authgroup with Caroline and Children

echo -n "Propose Withdrawal which will be approved by second authgroup with 2 required approvers: "
proposeTxid=$(proposeWithdrawal $user0_rpc_port $contractMultiSigExampleScid 5 $userAddress0 100 $userAddress2 2000)
echo $proposeTxid

sleep 2

echo -n "AtomicId for this transaction: "
atomicId=$(getAtomicId $contractMultiSigExampleScid $proposeTxid)
echo $atomicId

echo -n "Approval from Caroline: "
approvalTrans=$(approveTransaction $user0_rpc_port $contractMultiSigExampleScid $atomicId)
echo $approvalTrans

sleep 1

echo "TransState should be PENDING: "$(getTransactionState $contractMultiSigExampleScid $atomicId)

echo -n "Approval from Child1: "
approvalTrans=$(approveTransaction $user1_rpc_port $contractMultiSigExampleScid $atomicId)
echo $approvalTrans

sleep 1

echo "TransState should be DONE: "$(getTransactionState $contractMultiSigExampleScid $atomicId)


paintSmallSeparator

# Proposal 2: 2 out of 3 are required to approve if Authgroup with Caroline and Children and withdrawal limit, one approver rejects

echo -n "Propose Withdrawal which will be rejected by one: "
proposeTxid=$(proposeWithdrawal $user0_rpc_port $contractMultiSigExampleScid 5 $userAddress0 3422 $userAddress1 48747)
echo $proposeTxid

sleep 2

echo -n "AtomicId for this transaction: "
atomicId=$(getAtomicId $contractMultiSigExampleScid $proposeTxid)
echo $atomicId

echo -n "Approval from Caroline: "
approvalTrans=$(approveTransaction $user0_rpc_port $contractMultiSigExampleScid $atomicId)
echo $approvalTrans

sleep 1

echo "TransState should be PENDING: "$(getTransactionState $contractMultiSigExampleScid $atomicId)

echo -n "Rejection from Johnny: "
approvalTrans=$(rejectTransaction $user3_rpc_port $contractMultiSigExampleScid $atomicId)
echo $approvalTrans

sleep 1

echo "TransState should be PENDING: "$(getTransactionState $contractMultiSigExampleScid $atomicId)

echo -n "Approval from Child1: "
approvalTrans=$(approveTransaction $user1_rpc_port $contractMultiSigExampleScid $atomicId)
echo $approvalTrans

sleep 1

echo "TransState should be DONE: "$(getTransactionState $contractMultiSigExampleScid $atomicId)

paintSmallSeparator

# Proposal 3: Caroline approved, but transaction is cancelled before second signer

echo -n "Propose Withdrawal which will be rejected by one: "
proposeTxid=$(proposeWithdrawal $user0_rpc_port $contractMultiSigExampleScid 5 $userAddress0 1566 $userAddress1 5000)
echo $proposeTxid

sleep 2

echo -n "AtomicId for this transaction: "
atomicId=$(getAtomicId $contractMultiSigExampleScid $proposeTxid)
echo $atomicId

echo -n "Approval from Caroline: "
approvalTrans=$(approveTransaction $user0_rpc_port $contractMultiSigExampleScid $atomicId)
echo $approvalTrans

sleep 1

echo "TransState should be PENDING: "$(getTransactionState $contractMultiSigExampleScid $atomicId)

echo -n "Cancellation from transaction owner Caroline: "
cancelTrans=$(cancelWithdrawal $user0_rpc_port $contractMultiSigExampleScid $atomicId)
echo $cancelTrans

sleep 1

echo "TransState should be CANCELLED: "$(getTransactionState $contractMultiSigExampleScid $atomicId)

echo -n "Approval from Child1: "
approvalTrans=$(approveTransaction $user1_rpc_port $contractMultiSigExampleScid $atomicId)
echo $approvalTrans

sleep 1

echo "TransState should be CANCELLED: "$(getTransactionState $contractMultiSigExampleScid $atomicId)
