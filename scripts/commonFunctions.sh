CURDIR=`/bin/pwd`
BASEDIR=$(dirname $0)
ABSPATH=$(readlink -f $0)
ABSDIR=$(dirname $ABSPATH)

nametoaddressscid="0000000000000000000000000000000000000000000000000000000000000001"

function paintSeparator() {
    echo "======================================================================================================="
}

function paintSmallSeparator() {
    echo "------------------------"
}

function walletAddress() {
	curl --silent http://127.0.0.1:$1/json_rpc -d '{"jsonrpc":"2.0","id":"0","method":"GetAddress"}' -H 'Content-Type: application/json'| jq -r ".result.address"
}

function balance() {
  	curl --silent http://127.0.0.1:$1/json_rpc -d '{"jsonrpc":"2.0","id":"0","method":"getbalance"}' -H 'Content-Type: application/json'| jq -r ".result.balance"
}

function scbalance() {
  	curl --silent http://127.0.0.1:$daemon_rpc_port/json_rpc -d '{"jsonrpc":"2.0","id":"0","method":"getsc","params":{ "scid":"'"$1"'" , "code":false, "keysstring":["deposit_count"]}}' -H 'Content-Type: application/json' | jq -r ".result.balance"
}

function transferFees() {
	curl --silent http://127.0.0.1:$1/json_rpc -d '{"jsonrpc":"2.0","id":"0","method":"GetTransferbyTXID","params":{ "txid":"'$2'" }}' -H 'Content-Type: application/json' | jq -r ".result.entry.fees"
}

function randomAddress() {
	curl --silent http://127.0.0.1:$daemon_rpc_port/json_rpc -d '{"jsonrpc":"2.0","id":"0","method":"DERO.GetRandomAddress"}' -H 'Content-Type: application/json' | jq -r ".result.address[0]"
}

function registerName() {
	echo -n "wallet registering '$2' txid "
	curl --silent http://127.0.0.1:$1/json_rpc -d '{"jsonrpc":"2.0","id":"0","method":"scinvoke","params":{"scid":"'"$nametoaddressscid"'","ringsize":2, "sc_rpc":[{"name":"entrypoint","datatype":"S","value":"Register"},  {"name":"name","datatype":"S","value":"'"$2"'" }] }}' -H 'Content-Type: application/json' | jq -r ".result.txid"
}

function hex_to_ascii() {
	local result=$(echo $1 | xxd -r -p)
    echo -n $result
}

command -v curl >/dev/null 2>&1 || { echo "I require curl but it's not installed.  Aborting." >&2; exit 1; }
command -v jq >/dev/null 2>&1 || { echo "I require jq but it's not installed.  Aborting." >&2; exit 1; }
