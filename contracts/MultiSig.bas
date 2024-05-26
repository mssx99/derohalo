// MultiSigContract - USE AT YOUR OWN RISK: {"contractType":"MULTISIGNATURE","creator":"me","involvedParties":[{"id":"WJ0xaToIzRu4KkQU41a0e","address":"deto1qyre7td6x9r88y4cavdgpv6k7lvx6j39lfsx420hpvh3ydpcrtxrxqg8v8e3z","alias":"Caroline"},{"id":"2MUmstgUVgfqyB9Ku0dBz","address":"deto1qy2nxgts7wdn28ckc4l2tewphjcppqjfj69ddkxjn0ay8hlsjx73jqgmat5s8","alias":"Child1"},{"id":"NRFBXtuKq-CT9K7vIIyBi","address":"deto1qyzj2ldw7cjpprhf84ljmxdw54w72jekfkwt0nqsyyzgatttg37d2qgefmama","alias":"Child2"},{"id":"EBdKvNPzpTh0ICYKvVLRS","address":"deto1qyx7qyvrtrhvaszeej487k2g689fav7h38ay37fja9qf40ycgl0m2qg8ap2y9","alias":"Johnny"}],"authorizationGroups":[{"id":"a9KisKE5Jamx3Ti4SmHRW","approvers":[{"id":"0SGJ2PYnBjvanzKyfPBLZ","wallet":{"id":"EBdKvNPzpTh0ICYKvVLRS","address":"deto1qyx7qyvrtrhvaszeej487k2g689fav7h38ay37fja9qf40ycgl0m2qg8ap2y9","alias":"Johnny"}}],"withdrawalStartIn":0,"furtherDelay":[{"id":"WJ0xaToIzRu4KkQU41a0e","address":"deto1qyre7td6x9r88y4cavdgpv6k7lvx6j39lfsx420hpvh3ydpcrtxrxqg8v8e3z","alias":"Caroline"}]},{"id":"ii_6Twi4y08BKJZNsz161","approvers":[{"id":"7vUifT1lFxtFgt4e1crT3","wallet":{"id":"WJ0xaToIzRu4KkQU41a0e","address":"deto1qyre7td6x9r88y4cavdgpv6k7lvx6j39lfsx420hpvh3ydpcrtxrxqg8v8e3z","alias":"Caroline"}},{"id":"n2j-hr8dYTjPwaRJB3T56","wallet":{"id":"2MUmstgUVgfqyB9Ku0dBz","address":"deto1qy2nxgts7wdn28ckc4l2tewphjcppqjfj69ddkxjn0ay8hlsjx73jqgmat5s8","alias":"Child1"}},{"id":"V5yNk3YSA6SrIK7So75bH","wallet":{"id":"NRFBXtuKq-CT9K7vIIyBi","address":"deto1qyzj2ldw7cjpprhf84ljmxdw54w72jekfkwt0nqsyyzgatttg37d2qgefmama","alias":"Child2"}}],"maximumWithdrawal":200000,"requiredApprovers":2,"withdrawalStartIn":1000,"furtherDelay":[{"id":"2MUmstgUVgfqyB9Ku0dBz","address":"deto1qy2nxgts7wdn28ckc4l2tewphjcppqjfj69ddkxjn0ay8hlsjx73jqgmat5s8","alias":"Child1"},{"id":"NRFBXtuKq-CT9K7vIIyBi","address":"deto1qyzj2ldw7cjpprhf84ljmxdw54w72jekfkwt0nqsyyzgatttg37d2qgefmama","alias":"Child2"}]}],"maxTransactionsInAtomic":5}

Function InitializePrivate() Uint64
1 IF EXISTS("CountAtomic")==0 THEN GOTO 3
2 RETURN 1
3 STORE("TotalBalance",0)
4 STORE("MaxTransactionsInAtomic",5)
5 STORE("CountAtomic",0)
6 STORE("CountTransactions",0)
7 STORE("CountParties",4)
8 STORE("Approver0","deto1qyre7td6x9r88y4cavdgpv6k7lvx6j39lfsx420hpvh3ydpcrtxrxqg8v8e3z")
9 STORE("Approver1","deto1qy2nxgts7wdn28ckc4l2tewphjcppqjfj69ddkxjn0ay8hlsjx73jqgmat5s8")
10 STORE("Approver2","deto1qyzj2ldw7cjpprhf84ljmxdw54w72jekfkwt0nqsyyzgatttg37d2qgefmama")
11 STORE("Approver3","deto1qyx7qyvrtrhvaszeej487k2g689fav7h38ay37fja9qf40ycgl0m2qg8ap2y9")
12 STORE("RawApprover0",ADDRESS_RAW("deto1qyre7td6x9r88y4cavdgpv6k7lvx6j39lfsx420hpvh3ydpcrtxrxqg8v8e3z"))
13 STORE("RawApprover1",ADDRESS_RAW("deto1qy2nxgts7wdn28ckc4l2tewphjcppqjfj69ddkxjn0ay8hlsjx73jqgmat5s8"))
14 STORE("RawApprover2",ADDRESS_RAW("deto1qyzj2ldw7cjpprhf84ljmxdw54w72jekfkwt0nqsyyzgatttg37d2qgefmama"))
15 STORE("RawApprover3",ADDRESS_RAW("deto1qyx7qyvrtrhvaszeej487k2g689fav7h38ay37fja9qf40ycgl0m2qg8ap2y9"))
16 sendTokenToEachParty()
17 STORE("WithdrawBlock0",BLOCK_HEIGHT()+0)
18 STORE("WithdrawnGroup1",0)
19 STORE("WithdrawBlock1",BLOCK_HEIGHT()+1000)
20 RETURN 0
End Function

Function Deposit() Uint64
1 STORE("TotalBalance",LOAD("TotalBalance")+DEROVALUE())
2 RETURN 0
End Function

Function isInvolvedParty(signer String) Uint64
1 DIM a,countParties as Uint64
2 LET a=0
3 LET countParties=LOAD("CountParties")
4 IF LOAD("RawApprover"+a)!=signer THEN GOTO 6
5 RETURN 1
6 LET a=a+1
7 IF a<countParties THEN GOTO 4
8 RETURN 0
End Function

Function sendTokenToEachParty() Uint64
1 DIM scid as String
2 LET scid=SCID()
3 SEND_ASSET_TO_ADDRESS(LOAD("RawApprover0"),1,scid)
4 SEND_ASSET_TO_ADDRESS(LOAD("RawApprover1"),1,scid)
5 SEND_ASSET_TO_ADDRESS(LOAD("RawApprover2"),1,scid)
6 SEND_ASSET_TO_ADDRESS(LOAD("RawApprover3"),1,scid)
7 RETURN 0
End Function

Function ProposeWithdrawal(account0 String,amount0 Uint64,account1 String,amount1 Uint64,account2 String,amount2 Uint64,account3 String,amount3 Uint64,account4 String,amount4 Uint64) Uint64
1 DIM atomicId,startAtomic,endAtomic as Uint64
2 DIM signer as String
3 LET signer=SIGNER()
4 IF isInvolvedParty(signer)==1 THEN GOTO 6
5 RETURN 1
6 LET atomicId=LOAD("CountAtomic")+1
7 STORE("TransOwner_"+atomicId,signer)
8 STORE("TransOwnerAddress_"+atomicId,ADDRESS_STRING(signer))
9 LET startAtomic=LOAD("CountTransactions")+1
10 LET endAtomic=startAtomic
11 STORE("Start_"+atomicId,startAtomic)
12 LET endAtomic=registerTransactionForAtomic(endAtomic,account0,amount0)
13 LET endAtomic=registerTransactionForAtomic(endAtomic,account1,amount1)
14 LET endAtomic=registerTransactionForAtomic(endAtomic,account2,amount2)
15 LET endAtomic=registerTransactionForAtomic(endAtomic,account3,amount3)
16 LET endAtomic=registerTransactionForAtomic(endAtomic,account4,amount4)
17 IF startAtomic<endAtomic THEN GOTO 19
18 RETURN 0
19 LET endAtomic=endAtomic-1
20 STORE("End_"+atomicId,endAtomic)
21 STORE("CountAtomic",atomicId)
22 STORE("CountTransactions",endAtomic)
23 STORE("TransState_"+atomicId,"PENDING")
24 STORE("TransRegister_"+HEX(TXID()),atomicId)
25 RETURN 0
End Function

Function registerTransactionForAtomic(transId Uint64,account String,amount Uint64) Uint64
1 IF IS_ADDRESS_VALID(ADDRESS_RAW(account))==1 && amount>0 THEN GOTO 3
2 RETURN transId
3 STORE("TransAccount_"+transId,account)
4 STORE("TransAmount_"+transId,amount)
5 RETURN transId+1
End Function

Function CancelWithdrawal(atomicId Uint64) Uint64
1 IF LOAD("TransOwner_"+atomicId)==SIGNER() && LOAD("TransState_"+atomicId)=="PENDING" THEN GOTO 3
2 RETURN 1
3 STORE("TransState_"+atomicId,"CANCELLED")
4 RETURN 0
End Function

Function ApproveVote(atomicId Uint64) Uint64
1 DIM signer,transState as String
2 LET signer=SIGNER()
3 IF EXISTS("TransState_"+atomicId)==1 && isInvolvedParty(signer)==1 THEN GOTO 5
4 RETURN 1
5 LET transState=LOAD("TransState_"+atomicId)
6 IF transState=="PENDING" THEN GOTO 8
7 RETURN 1
8 DIM totalTransactionAmount,blockheight as Uint64
9 LET blockheight=BLOCK_HEIGHT()
10 LET totalTransactionAmount=getTotal(atomicId)
11 loadApprovers(atomicId)
12 setApprovalState(atomicId,signer,"APPROVED")
13 IF checkAuthGroupApproval0(atomicId,totalTransactionAmount,blockheight)==1 THEN GOTO 1000
14 IF checkAuthGroupApproval1(atomicId,totalTransactionAmount,blockheight)==1 THEN GOTO 1000
999 RETURN 0
1000 executeTransaction(atomicId)
1001 STORE("TransState_"+atomicId,"DONE")
1002 RETURN 0
End Function

Function loadApprovers(atomicId Uint64) Uint64
1 DIM countParties,a as Uint64
2 DIM approverKey as String
3 LET countParties=LOAD("CountParties")
4 LET a=0
5 LET approverKey=getApproverKey(atomicId,LOAD("RawApprover"+a))
6 IF EXISTS(approverKey)==0 THEN GOTO 9
7 IF LOAD(approverKey)!="APPROVED" THEN GOTO 9
8 MAPSTORE(approverKey,"APPROVED")
9 LET a=a+1
10 IF a<countParties THEN GOTO 5
11 RETURN 0
End Function

Function setApprovalState(atomicId Uint64,signer String,state String) Uint64
1 DIM approverKey as String
2 LET approverKey=getApproverKey(atomicId,signer)
3 IF state!="APPROVED" THEN GOTO 5
4 MAPSTORE(approverKey,state)
5 STORE(approverKey,state)
6 LET approverKey=getApproverAddressKey(atomicId,ADDRESS_STRING(signer))
7 STORE(approverKey,state)
8 RETURN 0
End Function

Function ResetVote(atomicId Uint64) Uint64
1 DIM signer,transState as String
2 LET signer=SIGNER()
3 LET transState=LOAD("TransState_"+atomicId)
4 IF transState=="PENDING" THEN GOTO 6
5 RETURN 1
6 DELETE(getApproverKey(atomicId,signer))
7 DELETE(getApproverAddressKey(atomicId,ADDRESS_STRING(signer)))
8 RETURN 0
End Function

Function RejectVote(atomicId Uint64) Uint64
1 DIM signer,transState as String
2 LET signer=SIGNER()
3 IF EXISTS("TransState_"+atomicId)==1 && isInvolvedParty(signer)==1 THEN GOTO 5
4 RETURN 1
5 LET transState=LOAD("TransState_"+atomicId)
6 IF transState=="PENDING" THEN GOTO 8
7 RETURN 1
8 setApprovalState(atomicId,signer,"REJECTED")
9 RETURN 0
End Function

Function getApproverKey(atomicId Uint64,signer String) String
1 RETURN "APPROVER_"+atomicId+"_"+signer
End Function

Function getApproverAddressKey(atomicId Uint64,address String) String
1 RETURN "APPROVERADDRESS_"+atomicId+"_"+SUBSTR(address,4,56)
End Function

Function getTotal(atomicId Uint64) Uint64
1 DIM startAtomic,endAtomic,transId,totalAmount as Uint64
2 LET startAtomic=LOAD("Start_"+atomicId)
3 LET endAtomic=LOAD("End_"+atomicId)
4 LET transId=startAtomic
5 LET totalAmount=0
6 LET totalAmount=totalAmount+LOAD("TransAmount_"+transId)
7 LET transId=transId+1
8 IF transId<=endAtomic THEN GOTO 6
9 RETURN totalAmount 
End Function

Function executeTransaction(atomicId Uint64) Uint64
1 DIM startAtomic,endAtomic,transId,amount as Uint64
2 DIM account as String
3 LET startAtomic=LOAD("Start_"+atomicId)
4 LET endAtomic=LOAD("End_"+atomicId)
5 LET transId=startAtomic
6 LET account=LOAD("TransAccount_"+transId)
7 LET amount=LOAD("TransAmount_"+transId)
8 SEND_DERO_TO_ADDRESS(ADDRESS_RAW(account),amount)
9 LET transId=transId+1
10 IF transId<=endAtomic THEN GOTO 6
11 RETURN 0 
End Function

Function checkAuthGroupApproval0(atomicId Uint64,totalTransactionAmount Uint64,blockheight Uint64) Uint64
1 IF blockheight<LOAD("WithdrawBlock0") THEN GOTO 2000
2 DIM approverCount as Uint64
3 IF MAPEXISTS(getApproverKey(atomicId,LOAD("RawApprover3")))==0 THEN GOTO 5
4 LET approverCount=approverCount+1
5 IF approverCount==0 THEN GOTO 2000
1000 RETURN 1
2000 RETURN 0
End Function

Function UpdateBlockheightAuthGroup0(additionalBlocks Uint64) Uint64
1 DIM signer as String
2 LET signer=SIGNER()
3 IF signer==LOAD("RawApprover0") THEN GOTO 5
4 RETURN 1
5 DIM withdrawBlock,currentBlockheight as Uint64
6 LET withdrawBlock=LOAD("WithdrawBlock0")
7 LET currentBlockheight=BLOCK_HEIGHT()
8 IF currentBlockheight<withdrawBlock THEN GOTO 10
9 LET withdrawBlock=currentBlockheight
10 STORE("WithdrawBlock0",withdrawBlock+additionalBlocks)
11 RETURN 0
End Function

Function checkAuthGroupApproval1(atomicId Uint64,totalTransactionAmount Uint64,blockheight Uint64) Uint64
1 DIM withdrawn as Uint64
2 LET withdrawn=LOAD("WithdrawnGroup1")
3 IF withdrawn+totalTransactionAmount>200000 THEN GOTO 2000
4 IF blockheight<LOAD("WithdrawBlock1") THEN GOTO 2000
5 DIM approverCount as Uint64
6 IF MAPEXISTS(getApproverKey(atomicId,LOAD("RawApprover0")))==0 THEN GOTO 8
7 LET approverCount=approverCount+1
8 IF MAPEXISTS(getApproverKey(atomicId,LOAD("RawApprover1")))==0 THEN GOTO 10
9 LET approverCount=approverCount+1
10 IF MAPEXISTS(getApproverKey(atomicId,LOAD("RawApprover2")))==0 THEN GOTO 12
11 LET approverCount=approverCount+1
12 IF approverCount<2 THEN GOTO 2000
1000 STORE("WithdrawnGroup1",withdrawn+totalTransactionAmount)
1001 RETURN 1
2000 RETURN 0
End Function

Function UpdateBlockheightAuthGroup1(additionalBlocks Uint64) Uint64
1 DIM signer as String
2 LET signer=SIGNER()
3 IF signer==LOAD("RawApprover1") THEN GOTO 6
4 IF signer==LOAD("RawApprover2") THEN GOTO 6
5 RETURN 1
6 DIM withdrawBlock,currentBlockheight as Uint64
7 LET withdrawBlock=LOAD("WithdrawBlock1")
8 LET currentBlockheight=BLOCK_HEIGHT()
9 IF currentBlockheight<withdrawBlock THEN GOTO 11
10 LET withdrawBlock=currentBlockheight
11 STORE("WithdrawBlock1",withdrawBlock+additionalBlocks)
12 RETURN 0
End Function
