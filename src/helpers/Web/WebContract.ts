import { CHAT_MINIMUM_CHARLIMIT_ALIAS, CHAT_MINIMUM_CHARLIMIT_DESCRIPTION, GUARANTEE_CHARLIMIT_MARKET, SCID_CHARLIMIT } from 'Constants';

const WEB_CONTRACT_CODE = `// WebContract - USE AT YOUR OWN RISK
// MaxPercentage = 100000,000 % (100000000)

Function InitializePrivate() Uint64
1 IF EXISTS("Owner")==0 THEN GOTO 3
2 RETURN 1
3 DIM signer as String
4 LET signer=SIGNER()
5 STORE("Owner",signer)
6 STORE("OwnerAddress",ADDRESS_STRING(signer))
7 STORE("Name","")
8 STORE("Description","")
9 STORE("ChatPublishFee",0)
10 STORE("ChatPublishFeeMinimum",0)
11 STORE("GuaranteePublishFee",0)
12 STORE("GuaranteePublishFeeMinimum",0)
13 STORE("GuaranteeApprovalRequiredBeforePublishing",0)
14 STORE("GuaranteeBlockPackageSize",0)
15 STORE("GuaranteeBlockPackagePrice",0)
16 RETURN 0
End Function

// Chat

Function PublishChatMinimum(chatMinimum Uint64,alias String,description String,destAccount String) Uint64
1 IF STRLEN(alias)<=${CHAT_MINIMUM_CHARLIMIT_ALIAS} && STRLEN(description)<=${CHAT_MINIMUM_CHARLIMIT_DESCRIPTION} && STRLEN(destAccount)<${SCID_CHARLIMIT} THEN GOTO 3
2 RETURN 1
3 DIM signer as String
4 DIM fee as Uint64
5 LET signer=SIGNER()
6 LET fee=getChatPublishFee(chatMinimum)
7 IF fee<=DEROVALUE() THEN GOTO 9
8 RETURN 1
9 saveChatMinimum(getChatKey(signer,destAccount),chatMinimum,alias,description)
10 RETURN 0
End Function

Function DeleteChatMinimum(destAccount String) Uint64
1 DIM key as String
2 LET key=getChatKey(SIGNER(),destAccount)
3 DELETE("ChatMinimum_"+key)
4 DELETE("ChatAlias_"+key)
5 DELETE("ChatDescription_"+key)
6 RETURN 0
End Function

Function getChatKey(signer String,destAccount String) String
1 DIM key as String
2 IF STRLEN(destAccount)>0 THEN GOTO 5
3 LET key=getShortAddress(ADDRESS_STRING(signer))
4 GOTO 6
5 LET key=getShortAddress(ADDRESS_STRING(signer))+"_"+getShortAddress(destAccount)
6 RETURN key
End Function

Function getShortAddress(address String) String
1 RETURN SUBSTR(address,4,56)
End Function

Function getChatPublishFee(chatMinimumAmount Uint64) Uint64
1 DIM fee,feeMinimum as Uint64
2 LET fee=LOAD("ChatPublishFee")
3 IF fee>10000000000 THEN GOTO 9  
4 LET fee=chatMinimumAmount*fee/10000000000
5 LET feeMinimum=LOAD("ChatPublishFeeMinimum")
6 IF fee>=feeMinimum THEN GOTO 10
7 LET fee=feeMinimum
8 GOTO 10
9 LET fee=fee-10000000001
10 RETURN fee
End Function

Function saveChatMinimum(key String,chatMinimum Uint64,alias String,description String) Uint64
1 STORE("ChatMinimum_"+key,chatMinimum)
2 STORE("ChatAlias_"+key,alias)
3 STORE("ChatDescription_"+key,description)
4 RETURN 0
End Function


// Market

Function PublishToMarket(scid String,market String,packages Uint64,guaranteeAmount Uint64) Uint64
1 IF STRLEN(scid)<${SCID_CHARLIMIT} && STRLEN(market)<${GUARANTEE_CHARLIMIT_MARKET} THEN GOTO 3
2 RETURN 1
3 DIM signer,listingKey,shortAddress as String
4 DIM fee,newBlockheight,paid,blocksOrdered,packageSize,packagePrice as Uint64
5 LET signer=SIGNER()
6 LET paid=DEROVALUE()
7 LET packageSize=LOAD("GuaranteeBlockPackageSize")
8 LET packagePrice=LOAD("GuaranteeBlockPackagePrice") 
9 LET blocksOrdered=packages*packageSize
10 LET fee=getGuaranteePublishFee(guaranteeAmount)+packages*packagePrice
11 IF fee<=paid THEN GOTO 13
12 RETURN 1
13 LET shortAddress=getShortAddress(ADDRESS_STRING(signer))
14 LET listingKey=getListingKey(shortAddress,scid)
15 LET newBlockheight=calcNewGuaranteeBlockheight(listingKey,blocksOrdered)
16 saveGuarantee(signer,listingKey,scid,market,newBlockheight,paid)
17 RETURN 0
End Function

Function ReturnMoneyAndRemove(listingKey String) Uint64
1 DIM signer,listingOwner as String
2 DIM paid as Uint64
3 LET signer=SIGNER();
4 IF LOAD("Owner")==signer THEN GOTO 6 
5 RETURN 1
6 LET paid=LOAD("ListingPaid_"+listingKey)
7 LET listingOwner=LOAD("ListingOwner_"+listingKey)
8 SEND_DERO_TO_ADDRESS(listingOwner,paid)
9 deleteGuarantee(listingKey)
10 RETURN 0
End Function

Function ApproveListing(listingKey String) Uint64
1 DIM signer as String
2 LET signer=SIGNER()
3 IF LOAD("Owner")==signer THEN GOTO 5 
4 RETURN 1
5 STORE("ListingStatus_"+listingKey,"ACTIVE")
6 RETURN 0
End Function

Function RemoveListing(scid String) Uint64
1 DIM signer,listingKey as String
2 LET signer=SIGNER()
3 LET listingKey=getListingKey(getShortAddress(ADDRESS_STRING(signer)),scid)
4 IF EXISTS("ListingStatus_"+listingKey)==0 THEN GOTO 9
5 IF LOAD("ListingStatus_"+listingKey)!="PENDING_APPROVAL" THEN GOTO 9
6 DIM paid as Uint64
7 LET paid=LOAD("ListingPaid_"+listingKey)
8 SEND_DERO_TO_ADDRESS(signer,paid)
9 deleteGuarantee(listingKey)
10 RETURN 0
End Function

Function getGuaranteePublishFee(guaranteeAmount Uint64) Uint64
1 DIM fee,feeMinimum as Uint64
2 LET fee=LOAD("GuaranteePublishFee")
3 IF fee>10000000000 THEN GOTO 9
4 LET fee=chatMinimumAmount*fee/10000000000
5 LET feeMinimum=LOAD("GuaranteePublishFeeMinimum")
6 IF fee>=feeMinimum THEN GOTO 10
7 LET fee=feeMinimum
8 GOTO 10
9 LET fee=fee-10000000001
10 RETURN fee
End Function

Function getListingKey(shortAddress String,scid String) String
1 RETURN HEX(SHA3256(scid+"_"+shortAddress))
End Function

Function calcNewGuaranteeBlockheight(listingKey String, blocksOrdered Uint64) Uint64
1 DIM currentBlockheight,remainingBlocks,oldBlockHeight,newBlockheight as Uint64
2 LET currentBlockheight=BLOCK_HEIGHT()
3 LET remainingBlocks=0
4 LET oldBlockHeight=currentBlockheight
5 IF EXISTS("ListingBlockheight_"+listingKey)==0 THEN GOTO 7
6 LET oldBlockHeight=LOAD("ListingBlockheight_"+listingKey)
7 IF oldBlockHeight<=currentBlockheight THEN GOTO 9
8 LET remainingBlocks=oldBlockHeight-currentBlockheight
9 LET newBlockheight=remainingBlocks+blocksOrdered
10 RETURN newBlockheight
End Function

Function saveGuarantee(owner String,listingKey String,scid String,market String,untilBlockheight Uint64,paid Uint64) Uint64
1 STORE("ListingOwner_"+listingKey,owner)
2 STORE("ListingScid_"+listingKey,scid)
3 STORE("ListingMarket_"+listingKey,market)
4 STORE("ListingBlockheight_"+listingKey,untilBlockheight)
5 STORE("ListingPaid_"+listingKey,paid)
6 IF LOAD("GuaranteeApprovalRequiredBeforePublishing")==1 THEN GOTO 9
7 STORE("ListingStatus_"+listingKey,"ACTIVE")
8 RETURN 0
9 STORE("ListingStatus_"+listingKey,"PENDING_APPROVAL")
10 RETURN 0
End Function

Function deleteGuarantee(listingKey String) Uint64
1 DELETE("ListingOwner_"+listingKey)
2 DELETE("ListingScid_"+listingKey)
3 DELETE("ListingMarket_"+listingKey)
4 DELETE("ListingBlockheight_"+listingKey)
5 DELETE("ListingPaid_"+listingKey)
6 DELETE("ListingStatus_"+listingKey)
7 RETURN 0
End Function

// Admin

Function Withdraw(amount Uint64) Uint64
1 DIM signer as String
2 LET signer=SIGNER()
3 IF LOAD("Owner")==signer THEN GOTO 5 
4 RETURN 1
5 SEND_DERO_TO_ADDRESS(signer,amount)
6 RETURN 0
End Function

Function Configure(name String, description String, chatPublishFee Uint64, chatPublishFeeMinimum Uint64, guaranteePublishFee Uint64, guaranteePublishFeeMinimum Uint64, guaranteeApprovalRequiredBeforePublishing Uint64, guaranteeBlockPackageSize Uint64, guaranteeBlockPackagePrice Uint64) Uint64
1 DIM signer as String
2 LET signer=SIGNER()
3 IF LOAD("Owner")==signer THEN GOTO 5 
4 RETURN 1
5 STORE("Name",name)
6 STORE("Description",description)
7 STORE("ChatPublishFee",chatPublishFee)
8 STORE("ChatPublishFeeMinimum",chatPublishFeeMinimum)
9 STORE("GuaranteePublishFee",guaranteePublishFee)
10 STORE("GuaranteePublishFeeMinimum",guaranteePublishFeeMinimum)
11 STORE("GuaranteeApprovalRequiredBeforePublishing",guaranteeApprovalRequiredBeforePublishing)
12 STORE("GuaranteeBlockPackageSize",guaranteeBlockPackageSize)
13 STORE("GuaranteeBlockPackagePrice",guaranteeBlockPackagePrice)
14 RETURN 0
End Function

Function TransferOwnership(newowner String) Uint64 
1  IF LOAD("Owner")==SIGNER() THEN GOTO 3 
2  RETURN 1
3  STORE("tmpowner",ADDRESS_RAW(newowner))
4  RETURN 0
End Function

Function ClaimOwnership() Uint64 
1 DIM signer as String
2 LET signer=SIGNER()
3 IF LOAD("tmpowner")==signer THEN GOTO 5 
4 RETURN 1
5 STORE("Owner",signer)
6 STORE("OwnerAddress",ADDRESS_STRING(SIGNER()))
7 DELETE("tmpowner")
8 RETURN 0
End Function`;

export default WEB_CONTRACT_CODE;
