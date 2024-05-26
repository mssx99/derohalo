// GuaranteeContract - USE AT YOUR OWN RISK: {"contractType":"GUARANTEE","firstPartyWallet":{"address":"deto1qyre7td6x9r88y4cavdgpv6k7lvx6j39lfsx420hpvh3ydpcrtxrxqg8v8e3z","alias":"Caroline"},"firstPartyAmountFunded":false,"secondPartyWallet":{"address":"deto1qy2nxgts7wdn28ckc4l2tewphjcppqjfj69ddkxjn0ay8hlsjx73jqgmat5s8","alias":"Child1"},"secondPartyAmountFunded":false,"state":"NEW","stages":[{"id":1,"description":"Sending first guitar.","blocks":7500,"offsetTo":-1,"a_Transfer":400,"a_Guarantee":10000,"b_Transfer":0,"b_Guarantee":30000,"a_Approved":false,"b_Approved":false},{"id":2,"description":"Sending 5 guitars more.","blocks":15000,"offsetTo":1,"a_Transfer":0,"a_Guarantee":10000,"b_Transfer":0,"b_Guarantee":30000,"a_Approved":false,"b_Approved":false},{"id":3,"description":null,"blocks":7500,"offsetTo":2,"a_Transfer":0,"a_Guarantee":10000,"b_Transfer":0,"b_Guarantee":30000,"a_Approved":false,"b_Approved":false},{"id":4,"description":null,"blocks":7500,"offsetTo":3,"a_Transfer":400,"a_Guarantee":10000,"b_Transfer":0,"b_Guarantee":30000,"a_Approved":false,"b_Approved":false},{"id":5,"description":null,"blocks":12000,"offsetTo":2,"a_Transfer":0,"a_Guarantee":10000,"b_Transfer":0,"b_Guarantee":30000,"a_Approved":false,"b_Approved":false},{"id":6,"description":null,"blocks":12000,"offsetTo":-2,"a_Transfer":0,"a_Guarantee":10000,"b_Transfer":0,"b_Guarantee":30000,"a_Approved":false,"b_Approved":false},{"id":7,"description":null,"blocks":200000,"a_Transfer":0,"a_Guarantee":10000,"b_Transfer":0,"b_Guarantee":30000,"a_Approved":false,"b_Approved":false}]}

Function InitializePrivate() Uint64
1 IF EXISTS("Owner")==0 THEN GOTO 3
2 RETURN 1
3 DIM signer as String
4 LET signer=SIGNER()
5 STORE("Owner",signer)
6 STORE("OwnerAddress",ADDRESS_STRING(signer))
7 STORE("NumberOfStages",7)
8 STORE("PartyA_TotalToBeDeposited",70800)
9 STORE("PartyB_TotalToBeDeposited",210000)
10 STORE("PartyA_Deposited",0)
11 STORE("PartyB_Deposited",0)
12 STORE("State","PENDING_DEPOSITS")
13 STORE("Description","")
14 STORE("PartyA_Address","deto1qyre7td6x9r88y4cavdgpv6k7lvx6j39lfsx420hpvh3ydpcrtxrxqg8v8e3z")
15 STORE("PartyB_Address","deto1qy2nxgts7wdn28ckc4l2tewphjcppqjfj69ddkxjn0ay8hlsjx73jqgmat5s8")
16 STORE("PartyA_RawAddress",ADDRESS_RAW("deto1qyre7td6x9r88y4cavdgpv6k7lvx6j39lfsx420hpvh3ydpcrtxrxqg8v8e3z"))
17 STORE("PartyB_RawAddress",ADDRESS_RAW("deto1qy2nxgts7wdn28ckc4l2tewphjcppqjfj69ddkxjn0ay8hlsjx73jqgmat5s8"))
18 STORE("Stage_1_Description","Sending first guitar.")
19 STORE("Stage_1_OffsetTo",0)
20 STORE("Stage_1_Blocks",7500)
21 STORE("Stage_1_A_Transfer",400)
22 STORE("Stage_1_A_Guarantee",10000)
23 STORE("Stage_1_B_Transfer",0)
24 STORE("Stage_1_B_Guarantee",30000)
25 STORE("Stage_1_A_Approved",0)
26 STORE("Stage_1_B_Approved",0)
27 STORE("Stage_2_Description","Sending 5 guitars more.")
28 STORE("Stage_2_OffsetTo",1)
29 STORE("Stage_2_Blocks",15000)
30 STORE("Stage_2_A_Transfer",0)
31 STORE("Stage_2_A_Guarantee",10000)
32 STORE("Stage_2_B_Transfer",0)
33 STORE("Stage_2_B_Guarantee",30000)
34 STORE("Stage_2_A_Approved",0)
35 STORE("Stage_2_B_Approved",0)
36 STORE("Stage_3_Description","")
37 STORE("Stage_3_OffsetTo",2)
38 STORE("Stage_3_Blocks",7500)
39 STORE("Stage_3_A_Transfer",0)
40 STORE("Stage_3_A_Guarantee",10000)
41 STORE("Stage_3_B_Transfer",0)
42 STORE("Stage_3_B_Guarantee",30000)
43 STORE("Stage_3_A_Approved",0)
44 STORE("Stage_3_B_Approved",0)
45 STORE("Stage_4_Description","")
46 STORE("Stage_4_OffsetTo",3)
47 STORE("Stage_4_Blocks",7500)
48 STORE("Stage_4_A_Transfer",400)
49 STORE("Stage_4_A_Guarantee",10000)
50 STORE("Stage_4_B_Transfer",0)
51 STORE("Stage_4_B_Guarantee",30000)
52 STORE("Stage_4_A_Approved",0)
53 STORE("Stage_4_B_Approved",0)
54 STORE("Stage_5_Description","")
55 STORE("Stage_5_OffsetTo",2)
56 STORE("Stage_5_Blocks",12000)
57 STORE("Stage_5_A_Transfer",0)
58 STORE("Stage_5_A_Guarantee",10000)
59 STORE("Stage_5_B_Transfer",0)
60 STORE("Stage_5_B_Guarantee",30000)
61 STORE("Stage_5_A_Approved",0)
62 STORE("Stage_5_B_Approved",0)
63 STORE("Stage_6_Description","")
64 STORE("Stage_6_OffsetTo",0)
65 STORE("Stage_6_Blocks",12000)
66 STORE("Stage_6_A_Transfer",0)
67 STORE("Stage_6_A_Guarantee",10000)
68 STORE("Stage_6_B_Transfer",0)
69 STORE("Stage_6_B_Guarantee",30000)
70 STORE("Stage_6_A_Approved",0)
71 STORE("Stage_6_B_Approved",0)
72 STORE("Stage_7_Description","")
73 STORE("Stage_7_OffsetTo",0)
74 STORE("Stage_7_Blocks",200000)
75 STORE("Stage_7_A_Transfer",0)
76 STORE("Stage_7_A_Guarantee",10000)
77 STORE("Stage_7_B_Transfer",0)
78 STORE("Stage_7_B_Guarantee",30000)
79 STORE("Stage_7_A_Approved",0)
80 STORE("Stage_7_B_Approved",0)
81 DIM blockheight as Uint64
82 LET blockheight=BLOCK_HEIGHT()
83 STORE("Stage_6_MaxBlockheight",blockheight+12000)
84 STORE("Stage_6_FinishedBlockheight",0)
85 sendTokenToEachParty()
86 RETURN 0
End Function

Function sendTokenToEachParty() Uint64
1 DIM scid as String
2 LET scid=SCID()
3 SEND_ASSET_TO_ADDRESS(LOAD("PartyA_RawAddress"),1,scid)
4 SEND_ASSET_TO_ADDRESS(LOAD("PartyB_RawAddress"),1,scid)
5 RETURN 0
End Function

Function getParty(signer String) String
1 IF signer!=LOAD("PartyA_RawAddress") THEN GOTO 3
2 RETURN "A"
3 IF signer!=LOAD("PartyB_RawAddress") THEN GOTO 5
4 RETURN "B"
5 PANIC
End Function

Function Deposit() Uint64
1 IF LOAD("State")=="PENDING_DEPOSITS" THEN GOTO 3
2 RETURN 1
3 DIM signer,party as String
4 DIM deposited as Uint64
5 LET signer=SIGNER()
6 LET party=getParty(signer)
7 LET deposited=DEROVALUE()
8 IF deposited==LOAD("Party"+party+"_TotalToBeDeposited") && LOAD("Party"+party+"_Deposited")==0 THEN GOTO 10
9 RETURN 1
10 STORE("Party"+party+"_Deposited",deposited)
11 checkStateActivation(party)
12 RETURN 0
End Function

Function Withdraw() Uint64
1 DIM signer,party as String
2 DIM deposited as Uint64
3 LET signer=SIGNER()
4 LET party=getParty(signer)
5 LET deposited=LOAD("Party"+party+"_Deposited")
6 IF LOAD("State")=="PENDING_DEPOSITS" && deposited>0 THEN GOTO 8
7 RETURN 1
8 SEND_DERO_TO_ADDRESS(signer,deposited)
9 STORE("Party"+party+"_Deposited",0)
10 RETURN 0
End Function

Function checkStateActivation(party String) Uint64
1 IF party=="A" THEN GOTO 4
2 IF LOAD("PartyA_Deposited")>0 THEN GOTO 6
3 RETURN 0
4 IF LOAD("PartyB_Deposited")>0 THEN GOTO 6
5 RETURN 0
6 STORE("State", "STARTED")
7 initMaxBlockHeights()
8 RETURN 0
End Function

Function initMaxBlockHeights() Uint64
1 DIM blockheight as Uint64
2 LET blockheight=BLOCK_HEIGHT()
3 STORE("Stage_1_MaxBlockheight",blockheight+7500)
4 STORE("Stage_1_FinishedBlockheight",0)
5 STORE("Stage_7_MaxBlockheight",200000)
6 STORE("Stage_7_FinishedBlockheight",0)
7 STORE("Stage_2_MaxBlockheight",30000)
8 STORE("Stage_2_FinishedBlockheight",0)
9 STORE("Stage_3_MaxBlockheight",37500)
10 STORE("Stage_3_FinishedBlockheight",0)
11 STORE("Stage_4_MaxBlockheight",45000)
12 STORE("Stage_4_FinishedBlockheight",0)
13 STORE("Stage_5_MaxBlockheight",42000)
14 STORE("Stage_5_FinishedBlockheight",0)
15 RETURN 0
End Function

Function Approve(stage Uint64) Uint64
1 IF LOAD("State")=="STARTED" THEN GOTO 3
2 RETURN 1
3 DIM signer,party as String
4 LET signer=SIGNER()
5 LET party=getParty(signer)
6 IF LOAD("Stage_"+stage+"_"+party+"_Approved")==0 THEN GOTO 8
7 RETURN 1
8 STORE("Stage_"+stage+"_"+party+"_Approved",1)
9 IF party=="B" THEN GOTO 12
10 IF LOAD("Stage_"+stage+"_B_Approved")==1 THEN GOTO 1000
11 RETURN 0
12 IF LOAD("Stage_"+stage+"_A_Approved")==1 THEN GOTO 1000
13 RETURN 0
1000 finalizeStage(stage)
1001 RETURN 0
End Function

Function ResetVote(stage Uint64) Uint64
1 IF LOAD("State")=="STARTED" THEN GOTO 3
2 RETURN 1
3 DIM signer,party as String
4 LET signer=SIGNER()
5 LET party=getParty(signer)
6 IF party=="B" THEN GOTO 9
7 IF LOAD("Stage_"+stage+"_B_Approved")==1 THEN GOTO 12
8 GOTO 10
9 IF LOAD("Stage_"+stage+"_A_Approved")==1 THEN GOTO 12
10 STORE("Stage_"+stage+"_"+party+"_Approved",0)
11 RETURN 0
12 RETURN 1
End Function

Function finalizeStage(stage Uint64) Uint64
1 DIM partyAraw,partyBraw as String
2 LET partyAraw=LOAD("PartyA_RawAddress")
3 LET partyBraw=LOAD("PartyB_RawAddress")
4 SEND_DERO_TO_ADDRESS(partyAraw,LOAD("Stage_"+stage+"_B_Transfer")+LOAD("Stage_"+stage+"_A_Guarantee"))
5 SEND_DERO_TO_ADDRESS(partyBraw,LOAD("Stage_"+stage+"_A_Transfer")+LOAD("Stage_"+stage+"_B_Guarantee"))
6 IF stage!=1 THEN GOTO 8
7 updateStage1Dependencies()
8 IF stage!=2 THEN GOTO 10
9 updateStage2Dependencies()
10 IF stage!=3 THEN GOTO 12
11 updateStage3Dependencies()
12 RETURN 0
End Function

Function updateStage1Dependencies() Uint64
1 DIM maxBlockheight,finishedBlockheight,anticipateBlocks as Uint64
2 LET maxBlockheight=LOAD("Stage_1_MaxBlockheight")
3 LET finishedBlockheight=BLOCK_HEIGHT()
4 IF finishedBlockheight<=maxBlockheight THEN GOTO 6
5 PANIC
6 STORE("Stage_1_FinishedBlockheight",finishedBlockheight)
7 LET anticipateBlocks=maxBlockheight-finishedBlockheight
8 updateStage2(anticipateBlocks)
9 RETURN 0
End Function

Function updateStage2Dependencies() Uint64
1 DIM maxBlockheight,finishedBlockheight,anticipateBlocks as Uint64
2 LET maxBlockheight=LOAD("Stage_2_MaxBlockheight")
3 LET finishedBlockheight=BLOCK_HEIGHT()
4 IF finishedBlockheight<=maxBlockheight THEN GOTO 6
5 PANIC
6 STORE("Stage_2_FinishedBlockheight",finishedBlockheight)
7 LET anticipateBlocks=maxBlockheight-finishedBlockheight
8 updateStage3(anticipateBlocks)
9 updateStage5(anticipateBlocks)
10 RETURN 0
End Function

Function updateStage3Dependencies() Uint64
1 DIM maxBlockheight,finishedBlockheight,anticipateBlocks as Uint64
2 LET maxBlockheight=LOAD("Stage_3_MaxBlockheight")
3 LET finishedBlockheight=BLOCK_HEIGHT()
4 IF finishedBlockheight<=maxBlockheight THEN GOTO 6
5 PANIC
6 STORE("Stage_3_FinishedBlockheight",finishedBlockheight)
7 LET anticipateBlocks=maxBlockheight-finishedBlockheight
8 updateStage4(anticipateBlocks)
9 RETURN 0
End Function

Function updateStage2(anticipateBlocks Uint64) Uint64
1 IF LOAD("Stage_2_FinishedBlockheight")==0 THEN GOTO 3
2 RETURN 0
3 STORE("Stage_2_MaxBlockheight",LOAD("Stage_2_MaxBlockheight")-anticipateBlocks)
4 updateStage3(anticipateBlocks)
5 updateStage5(anticipateBlocks)
6 RETURN 0
End Function

Function updateStage3(anticipateBlocks Uint64) Uint64
1 IF LOAD("Stage_3_FinishedBlockheight")==0 THEN GOTO 3
2 RETURN 0
3 STORE("Stage_3_MaxBlockheight",LOAD("Stage_3_MaxBlockheight")-anticipateBlocks)
4 updateStage4(anticipateBlocks)
5 RETURN 0
End Function

Function updateStage4(anticipateBlocks Uint64) Uint64
1 IF LOAD("Stage_4_FinishedBlockheight")==0 THEN GOTO 3
2 RETURN 0
3 STORE("Stage_4_MaxBlockheight",LOAD("Stage_4_MaxBlockheight")-anticipateBlocks)
4 RETURN 0
End Function

Function updateStage5(anticipateBlocks Uint64) Uint64
1 IF LOAD("Stage_5_FinishedBlockheight")==0 THEN GOTO 3
2 RETURN 0
3 STORE("Stage_5_MaxBlockheight",LOAD("Stage_5_MaxBlockheight")-anticipateBlocks)
4 RETURN 0
End Function

Function AddImageBaseInfo(thumb String,pieces Uint64,description String) Uint64
1 IF LOAD("Owner")==SIGNER() && LOAD("PartyA_Deposited")==0 && LOAD("PartyB_Deposited")==0 THEN GOTO 3
2 RETURN 1
3 DIM id as String
4 LET id=HEX(TXID())
5 STORE("IMAGE"+id+"_PIECES",pieces)
6 STORE("IMAGE"+id+"_DESCRIPTION",description)
7 STORE("IMAGE"+id+"_THUMB",thumb)
8 RETURN 0
End Function

Function AddImageMain(id String,piece Uint64,data String) Uint64
1 IF LOAD("Owner")==SIGNER() && LOAD("PartyA_Deposited")==0 && LOAD("PartyB_Deposited")==0 THEN GOTO 3
2 RETURN 1
3 STORE("IMAGE"+id+"_"+piece,data)
4 RETURN 0
End Function

Function RemoveImage(id String) Uint64
1 IF LOAD("Owner")==SIGNER() && LOAD("PartyA_Deposited")==0 && LOAD("PartyB_Deposited")==0 THEN GOTO 3
2 RETURN 1
3 DIM pieces,currentPiece as Uint64
4 LET pieces=LOAD("IMAGE"+id+"_PIECES")
5 DELETE("IMAGE"+id+"_PIECES")
6 DELETE("IMAGE"+id+"_THUMB")
7 DELETE("IMAGE"+id+"_DESCRIPTION")
8 LET currentPiece=1
9 DELETE("IMAGE"+id+"_"+currentPiece)
10 LET currentPiece=currentPiece+1
11 IF currentPiece<=pieces THEN GOTO 9
12 RETURN 0
End Function
