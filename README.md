# ![Derohalo Logo](public/derohaloLogo.png)

This project shows some new use-cases for crypto using the Dero network - private by default with homomorphic encryption. It consists out of a
React Typescript client-side frontend and the Dero-Network as backend. No server-side code used. This allows for running it everywhere, even on
IPFS anonymously and in a decentralized manner. The project includes the compiled Dero-simulator for Windows and Linux in its compiled state.
If you want to compile it yourself you need to base it off of [Slixe PR 135 for adding the XSWD Protocol](https://github.com/deroproject/derohe/pull/135) and merge in the fix for the Sender-Field
of [Slixe PR 147](https://github.com/deroproject/derohe/pull/147). Currently the metadata is exposed though until a patch will be applied, as of May 23rd 2024 there are already some proposals,
like [Slixe PR 179](https://github.com/deroproject/derohe/pull/179).

## Economic Use-Cases for this application

The project consists out of five use-cases

### MultiSignature

The first tab allows you to design a Multi-Signature contract with Authorization-Groups and assign conditions and approvers to them.

As conditions for now there are the following possibilities per AuthGroup

-   Withdrawal Limit
-   2 out of 3 approvers (x out of y approvers)
-   Locked until blockheight
-   Extend Locktime permission for certain users (Inheritance function)

The Inheritance-Function has massive potential, as you can take the smartcontract and hand it over to your heirs or a lawyer and give each of your heirs the private keys.
While you keep extending the lock they will not be able to withdraw using their private keys. Each year worldwide 3 trillion USD are being inherited. Also some people who are in crypto might
want to use that option in case they die in a car accident ahead of time. Also Bitcoin has a MarketCap of 2 trillion USD already. If some change some of their funds to Dero this can already have a huge impact.

### Guarantees

The second tab is for creating Guarantee-Contracts which allow you to trade or trust anyone in the entire world without knowing them in total anonimity and untraceability.

This is being achieved by putting both parties into the same economic boat under the conditions they previously agreed upon. There is no third party judge, only the two involved parties which determine if they approve a stage or not. You can define several stages, each of them having 4 fields regarding guarantees/transfers for each party and an optional maximum time-limit (after the time-limit even if both approve a stage the contract will not execute the amounts anymore and the money assigned to the stage will be lost forever for both parties).
The original concept for this was done like 10 years ago with the technology that existed back then usinh BlackCoin and Bitcoin called BlackHalo and BitHalo by David Zimbeck.
It fascinated me right from the start and was astounding as those cryptos did not even support SmartContracts. This app takes it a step further by allowing more than one stage and you can define the time-limit being dependent on the time another stage finishes. **You can also add images to your smart contract.**

International trade goes into the trillions and many times the cost associated with making sure that the other party delivers their product or service are still to high and inhibit international trade.
Ask for a guarantee much higher than the price of the product, so that the seller will have an economic disadvantage not delivering and making you angry so that you do not approve the stage.
Obviously your counterparty will ask for some guarantee from you as well, so that you care also about the transaction being successfull and approved.
You could also use this as something like a creditline and do multiple transactions one after another leaving the creditline untouched. For example, trade a 1000 USD in Bitcoin with a 100 USD guarantee from both and then move 50 USD worth 20 times. When not needed anymore both approve returning the funds.

In terms of crypto this could be seen as as an **alternative to atomic swaps**.

### Listings

The third tab is for people who try to find counterparties for things that they need, you can list your guarantee-contracts with an open party B or search for some contract that interests you.
The Website owner (or webcontract owner) can earn money by setting commissions for listings.

He can require approval before some contract is being listed. If he requires approval he can choose to accept or reject. If he rejects the user gets his money back. If he leaves it pending the user can withdraw his request, which will give him his money back as well.

### Chat

This function allows the sending of Text, Images and Audio while earning money receiving messages and facilitates as well the exchange of messages for all types of contracts.

There is also the possibility to create a DeroHalo-Button that you can add to your website and assign functions to it like "Open Chat" or "Open MultiSig/Guarantee/Web" contracts.
The website introduces a new protocol "web+derohalo:" which allows the user to choose a derohalo-copy hosted anywhere and have the button open that site without knowing which one you are using.
Being a React-app you can also install Derohalo locally in your browser.

Imagine some famous person accepting marriage proposals, but asks for 500 USD in Dero in order to receive the messages. There might be thousands of users willing to send them a picture and attaching
500 USD or more to it + a voice message. In the case the user defined 500 USD (equivalent in Dero) messages sending more will receive a different background color, the maximum received will have a totally red background and the ones with the minimum would be displayed with a white background, everything in between will be proportionally in tones between white and red. The receiver can filter out the messages by using a slider quickly.

The website owner can as well here earn money by getting commissions for the registration of chat minimums. You can set a Minimum for all and for single accounts, so that your friend pays the minimum necessary to send a transaction, which would be 0.00001 Deros, while others (unknown people) need to send you 10 Deros in order to establish contact. This is a lucrative way to filter spam.

There are 2 billion Whatsapp users. Some of them complain about loosing their privacy. Famous people, or people like Captain could use this for total privacy and earning some money. Even the IP is not available for eavesdroppers.

### Web Contract

The website has a built-in default webcontract. But if you do not like the commissions of one provider, you can just paste in another webcontract or create your own by pressing a simple button and have that contract circulate.

## Contract-Verification

It is extremely important to know that you can trust a SmartContract. Not everyone wants to check the customized code manually every time when opening one, especially if looking at the
listings. The application does this automatically by comparing the code of the Smart Contract that is being loaded to the code it would generate using the JSON in the beginning. If there are differences
it will open a Dialog where the user sees the parts which differ highlighted. He can then reject to open the contract.

That is why the **web+derohalo:** protocol is so important. The user can select a website he trusts for checking the code. Because there could be malicious websites out there which ignore errors
or do not check properly the code. Only in cases where the user did not register a service handler for the protocol a fallback-URL, which the button creator can define, will be used.

## How to build

Start simulator with created example contracts (takes around 2 minutes) and actions:<br>
`yarn run simulator_xswd_start`

This will set as well variables in .env.development with the created example contracts.

Run the React-app:<br>
`yarn install`<br>
`yarn start`
or (better)
`HTTPS=true yarn start` for supporting the "web+derohalo:"-protocol.<br>

## Video

[![DeroHalo - a Dero Showcase](https://img.youtube.com/vi/2hN2QOdOkso/sddefault.jpg)](https://www.youtube.com/watch?v=2hN2QOdOkso)

## Disclaimer

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
