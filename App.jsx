import { Alert, Button, Card, Col, Input, List, Menu, Row, Tabs, Dropdown, Badge } from "antd";
import "antd/dist/antd.css";

import {
  useBalance,
  useContractLoader,
  useContractReader,
  useGasPrice,
  useOnBlock,
  useUserProviderAndSigner,
} from "eth-hooks";
import { useExchangeEthPrice } from "eth-hooks/dapps/dex";
import React, { useCallback, useEffect, useState } from "react";
import { Link, Route, Switch, useLocation } from "react-router-dom";
import "./App.css";
import {
  Account,
  Address,
  Contract,
  Faucet,
  GasGauge,
  Header,
  Ramp,
  ThemeSwitch,
  NetworkDisplay,
  FaucetHint,
  Footer,
} from "./components";
import { NETWORKS, ALCHEMY_KEY } from "./constants";
import externalContracts from "./contracts/external_contracts";
// contracts
import deployedContracts from "./contracts/hardhat_contracts.json";
import { Transactor, Web3ModalSetup } from "./helpers";
import { YourLoogies, YourFancyLoogies, YourAccesories, FancyLoogiePreview, FancyLoogies } from "./views";
import { useStaticJsonRPC } from "./hooks";
const { TabPane } = Tabs;

const { ethers } = require("ethers");
/*
    Welcome to 🏗 scaffold-eth !

    Code:
    https://github.com/scaffold-eth/scaffold-eth

    Support:
    https://t.me/joinchat/KByvmRe5wkR-8F_zz6AjpA
    or DM @austingriffith on twitter or telegram

    You should get your own Infura.io ID and put it in `constants.js`
    (this is your connection to the main Ethereum network for ENS etc.)


    🌏 EXTERNAL CONTRACTS:
    You can also bring in contract artifacts in `constants.js`
    (and then use the `useExternalContractLoader()` hook!)
*/

/// 📡 What chain are your contracts deployed to?
const targetNetwork = NETWORKS.ropsten; // <------- select your target frontend network (localhost, rinkeby, xdai, mainnet)

// 😬 Sorry for all the console logging
const DEBUG = true;
const NETWORKCHECK = true;

// 🛰 providers
if (DEBUG) console.log("📡 Connecting to Mainnet Ethereum");

// 🔭 block explorer URL
const blockExplorer = targetNetwork.blockExplorer;

const web3Modal = Web3ModalSetup();

// 🛰 providers
const providers = [
  "https://eth-mainnet.gateway.pokt.network/v1/lb/611156b4a585a20035148406",
  `https://eth-mainnet.alchemyapi.io/v2/${ALCHEMY_KEY}`,
  "https://rpc.scaffoldeth.io:48544",
];

function App(props) {
  const [injectedProvider, setInjectedProvider] = useState();
  const [address, setAddress] = useState();
  const location = useLocation();

  // load all your providers
  const localProvider = useStaticJsonRPC([
    process.env.REACT_APP_PROVIDER ? process.env.REACT_APP_PROVIDER : targetNetwork.rpcUrl,
  ]);
  const mainnetProvider = useStaticJsonRPC(providers);

  const logoutOfWeb3Modal = async () => {
    await web3Modal.clearCachedProvider();
    if (injectedProvider && injectedProvider.provider && typeof injectedProvider.provider.disconnect == "function") {
      await injectedProvider.provider.disconnect();
    }
    setTimeout(() => {
      window.location.reload();
    }, 1);
  };

  /* 💵 This hook will get the price of ETH from 🦄 Uniswap: */
  const price = useExchangeEthPrice(targetNetwork, mainnetProvider);

  /* 🔥 This hook will get the price of Gas from ⛽️ EtherGasStation */
  const gasPrice = useGasPrice(targetNetwork, "fast");
  // Use your injected provider from 🦊 Metamask or if you don't have it then instantly generate a 🔥 burner wallet.
  const userProviderAndSigner = useUserProviderAndSigner(injectedProvider, localProvider);
  const userSigner = userProviderAndSigner.signer;

  useEffect(() => {
    async function getAddress() {
      if (userSigner) {
        const newAddress = await userSigner.getAddress();
        setAddress(newAddress);
      }
    }
    getAddress();
  }, [userSigner]);

  // You can warn the user if you would like them to be on a specific network
  const localChainId = localProvider && localProvider._network && localProvider._network.chainId;
  const selectedChainId =
    userSigner && userSigner.provider && userSigner.provider._network && userSigner.provider._network.chainId;

  // For more hooks, check out 🔗eth-hooks at: https://www.npmjs.com/package/eth-hooks

  // The transactor wraps transactions and provides notificiations
  const tx = Transactor(userSigner, gasPrice);

  // 🏗 scaffold-eth is full of handy hooks like this one to get your balance:
  const yourLocalBalance = useBalance(localProvider, address);

  // Just plug in different 🛰 providers to get your balance on different chains:
  const yourMainnetBalance = useBalance(mainnetProvider, address);

  // const contractConfig = useContractConfig();

  const contractConfig = { deployedContracts: deployedContracts || {}, externalContracts: externalContracts || {} };

  // Load in your local 📝 contract and read a value from it:
  const readContracts = useContractLoader(localProvider, contractConfig);

  // If you want to make 🔐 write transactions to your contracts, use the userSigner:
  const writeContracts = useContractLoader(userSigner, contractConfig, localChainId);

  // EXTERNAL CONTRACT EXAMPLE:
  //
  // If you want to bring in the mainnet DAI contract it would look like:
  const mainnetContracts = useContractLoader(mainnetProvider, contractConfig);

  // If you want to call a function on a new block
  useOnBlock(mainnetProvider, () => {
    console.log(`⛓ A new mainnet block is here: ${mainnetProvider._lastBlockNumber}`);
  });

  const [updateBalances, setUpdateBalances] = useState(0);

  //
  // 🧫 DEBUG 👨🏻‍🔬
  //
  useEffect(() => {
    if (
      DEBUG &&
      mainnetProvider &&
      address &&
      selectedChainId &&
      yourLocalBalance &&
      yourMainnetBalance &&
      readContracts &&
      writeContracts &&
      mainnetContracts
    ) {
      console.log("_____________________________________ 🏗 scaffold-eth _____________________________________");
      console.log("🌎 mainnetProvider", mainnetProvider);
      console.log("🏠 localChainId", localChainId);
      console.log("👩‍💼 selected address:", address);
      console.log("🕵🏻‍♂️ selectedChainId:", selectedChainId);
      console.log("💵 yourLocalBalance", yourLocalBalance ? ethers.utils.formatEther(yourLocalBalance) : "...");
      console.log("💵 yourMainnetBalance", yourMainnetBalance ? ethers.utils.formatEther(yourMainnetBalance) : "...");
      console.log("📝 readContracts", readContracts);
      console.log("🌍 DAI contract on mainnet:", mainnetContracts);
      console.log("🔐 writeContracts", writeContracts);
    }
  }, [
    mainnetProvider,
    address,
    selectedChainId,
    yourLocalBalance,
    yourMainnetBalance,
    readContracts,
    writeContracts,
    mainnetContracts,
  ]);

  const loadWeb3Modal = useCallback(async () => {
    const provider = await web3Modal.connect();
    setInjectedProvider(new ethers.providers.Web3Provider(provider));

    provider.on("chainChanged", chainId => {
      console.log(`chain changed to ${chainId}! updating providers`);
      setInjectedProvider(new ethers.providers.Web3Provider(provider));
    });

    provider.on("accountsChanged", () => {
      console.log(`account changed!`);
      setInjectedProvider(new ethers.providers.Web3Provider(provider));
    });

    // Subscribe to session disconnection
    provider.on("disconnect", (code, reason) => {
      console.log(code, reason);
      logoutOfWeb3Modal();
    });
  }, [setInjectedProvider]);

  useEffect(() => {
    if (web3Modal.cachedProvider) {
      loadWeb3Modal();
    }
  }, [loadWeb3Modal]);

  const faucetAvailable = localProvider && localProvider.connection && targetNetwork.name.indexOf("local") !== -1;

  const nfts = ["Orb", "TruthSphere", "SixPath"];

  const nftsSvg = {
    Orb: (
      <g class="bow" fill="#1890ff" transform="translate(-10,0) scale(0.07 0.07)">

      </g>
    ),
    TruthSphere: (
      <g class="eyelash" fill="#1890ff" transform="translate(-17,0) scale(0.2 0.2)">

      </g>
    ),
    SixPath: (
      <g class="mustache" transform="translate(1,0) scale(0.2 0.2)">,
        <g fill="#1890ff">
         
        </g>
      </g>
    ),
  };

  const [fancyLoogieContracts, setFancyLoogieContracts] = useState([]);
  const [fancyLoogiesNfts, setFancyLoogiesNfts] = useState();
  const [selectedFancyLoogie, setSelectedFancyLoogie] = useState();
  const [selectedNfts, setSelectedNfts] = useState({});
  const [selectedFancyLoogiePreview, setSelectedFancyLoogiePreview] = useState({});
  const [fancyLoogiePreviewActiveTab, setFancyLoogiePreviewActiveTab] = useState("preview-Bow");

  const initCount = {
    Bow: 0,
    Eyelash: 0,
    Mustache: 0,
    ContactLenses: 0,
  };

  const [yourNftsCount, setYourNftsCount] = useState(initCount);

  useEffect(() => {
    const updateFancyLoogieContracts = async () => {
      if (readContracts.FancyLoogie) {
        if (DEBUG) console.log("Updating FancyLoogie contracts address...");
        const fancyLoogieContractsAddress = await readContracts.FancyLoogie.getContractsAddress();
        if (DEBUG) console.log("🤗 fancy loogie contracts:", fancyLoogieContractsAddress);
        setFancyLoogieContracts(fancyLoogieContractsAddress);
      }
    };
    updateFancyLoogieContracts();
  }, [address, readContracts.FancyLoogie]);

  return (
    <div className="App">
      {/* ✏️ Edit the header and change the title to your project name */}
      <Header />
      <NetworkDisplay
        NETWORKCHECK={NETWORKCHECK}
        localChainId={localChainId}
        selectedChainId={selectedChainId}
        targetNetwork={targetNetwork}
      />
      <Menu style={{ textAlign: "center" }} selectedKeys={[location.pathname]} mode="horizontal">
                <Menu.Item key="/yourLoogies">
          <Link to="/yourLoogies">Mint here</Link>
        </Menu.Item>
        <Menu.Item key="/">
          <Link to="/">Everything ever minted</Link>
        </Menu.Item>
        <Menu.Item key="/yourFancyLoogies">
          <Link to="/yourFancyLoogies">Stuff you own</Link>
        </Menu.Item>


      </Menu>

      <Switch>
        <Route exact path="/">
          <FancyLoogies
            readContracts={readContracts}
            mainnetProvider={mainnetProvider}
            blockExplorer={blockExplorer}
            DEBUG={DEBUG}
          />
        </Route>
        <Route exact path="/yourLoogies">
          <YourLoogies
            DEBUG={DEBUG}
            readContracts={readContracts}
            writeContracts={writeContracts}
            tx={tx}
            mainnetProvider={mainnetProvider}
            blockExplorer={blockExplorer}
            address={address}
            updateBalances={updateBalances}
            setUpdateBalances={setUpdateBalances}
          />
        </Route>
        <Route exact path="/yourFancyLoogies">
          <YourFancyLoogies
            DEBUG={DEBUG}
            readContracts={readContracts}
            writeContracts={writeContracts}
            tx={tx}
            mainnetProvider={mainnetProvider}
            blockExplorer={blockExplorer}
            address={address}
            updateBalances={updateBalances}
            setUpdateBalances={setUpdateBalances}
            fancyLoogieContracts={fancyLoogieContracts}
            fancyLoogiesNfts={fancyLoogiesNfts}
            setFancyLoogiesNfts={setFancyLoogiesNfts}
            selectedFancyLoogie={selectedFancyLoogie}
            setSelectedFancyLoogie={setSelectedFancyLoogie}
            selectedNfts={selectedNfts}
            setSelectedFancyLoogiePreview={setSelectedFancyLoogiePreview}
            nfts={nfts}
            setSelectedNfts={setSelectedNfts}
          />
        </Route>
        <Route exact path="/yourAccesories">
          <FancyLoogiePreview
            DEBUG={DEBUG}
            readContracts={readContracts}
            writeContracts={writeContracts}
            tx={tx}
            address={address}
            updateBalances={updateBalances}
            setUpdateBalances={setUpdateBalances}
            nfts={nfts}
            nftsSvg={nftsSvg}
            fancyLoogiesNfts={fancyLoogiesNfts}
            selectedFancyLoogie={selectedFancyLoogie}
            selectedFancyLoogiePreview={selectedFancyLoogiePreview}
            setSelectedFancyLoogiePreview={setSelectedFancyLoogiePreview}
            selectedNfts={selectedNfts}
            setSelectedNfts={setSelectedNfts}
            setFancyLoogiesNfts={setFancyLoogiesNfts}
            fancyLoogiePreviewActiveTab={fancyLoogiePreviewActiveTab}
            setFancyLoogiePreviewActiveTab={setFancyLoogiePreviewActiveTab}
          />
          <Tabs
            defaultActiveKey="/"
            tabPosition="left"
            id="tabs-accesories"
            tabBarExtraContent={
              <Alert
                message="Choose an accesory type and mint a new NFT."
                description={
                  <p>
                    If:
                    <ul>
                      <li>
                        You have a <strong>TruthSeeker selected to wear</strong> and
                      </li>
                      <li>
                        The TruthSeeker <strong>doesn't have this kind of artefact</strong>,
                      </li>
                    </ul>
                    Then, you will be able to preview the artefact on your <strong>TruthSeeker</strong>.
                  </p>
                }
                type="info"
              />
            }>
            {nfts.map(function (nft) {
              return (
                <TabPane
                  tab={
                    <div class="tab-item">
       
                      <Badge count={yourNftsCount[nft]}>
                        <p style={{ float: "left", marginBottom: 0, fontSize: 24, fontWeight: "bold", marginLeft: 5 }}>
                          {nft}
                        </p>
                      </Badge>
                    </div>
                  }
                  key={nft}
                >
                  <YourAccesories
                    DEBUG={DEBUG}
                    readContracts={readContracts}
                    writeContracts={writeContracts}
                    tx={tx}
                    mainnetProvider={mainnetProvider}
                    blockExplorer={blockExplorer}
                    address={address}
                    updateBalances={updateBalances}
                    setUpdateBalances={setUpdateBalances}
                    nft={nft}
                    fancyLoogiesNfts={fancyLoogiesNfts}
                    selectedFancyLoogie={selectedFancyLoogie}
                    selectedNfts={selectedNfts}
                    setSelectedNfts={setSelectedNfts}
                    setFancyLoogiePreviewActiveTab={setFancyLoogiePreviewActiveTab}
                  />
                </TabPane>
              );
            })}
          </Tabs>
        </Route>
        <Route exact path="/howto">
          <div style={{ fontSize: 18, width: 820, margin: "auto" }}>
            <h2 style={{ fontSize: "2em", fontWeight: "bold" }}>How to add Optimistic Ethereum network on MetaMask</h2>
            <div style={{ textAlign: "left", marginLeft: 50, marginBottom: 50 }}>
              <ul>
                <li>
                  Go to <a target="_blank" href="https://chainid.link/?network=optimism">https://chainid.link/?network=optimism</a>
                </li>
                <li>
                  Click on <strong>connect</strong> to add the <strong>Optimistic Ethereum</strong> network in <strong>MetaMask</strong>.
                </li>
              </ul>
            </div>
            <h2 style={{ fontSize: "2em", fontWeight: "bold" }}>How to add funds to your wallet on Optimistic Ethereum network</h2>
            <div style={{ textAlign: "left", marginLeft: 50, marginBottom: 100 }}>
              <ul>
                <li><a href="https://portr.xyz/" target="_blank">The Teleporter</a>: the cheaper option, but with a 0.05 ether limit per transfer.</li>
                <li><a href="https://gateway.optimism.io/" target="_blank">The Optimism Gateway</a>: larger transfers and cost more.</li>
                <li><a href="https://app.hop.exchange/send?token=ETH&sourceNetwork=ethereum&destNetwork=optimism" target="_blank">Hop.Exchange</a>: where you can send from/to Ethereum mainnet and other L2 networks.</li>
              </ul>
            </div>
          </div>
        </Route>
        <Route exact path="/debug">
          <div style={{ padding: 32 }}>
            <Address value={readContracts && readContracts.FancyLoogie && readContracts.FancyLoogie.address} />
          </div>
          <Contract
            name="FancyLoogie"
            price={price}
            signer={userSigner}
            provider={localProvider}
            address={address}
            blockExplorer={blockExplorer}
            contractConfig={contractConfig}
          />
        </Route>
      </Switch>

      <Footer />

      <ThemeSwitch />

      {/* 👨‍💼 Your account is in the top right with a wallet at connect options */}
      <div style={{ position: "fixed", textAlign: "right", right: 0, top: 0, padding: 10 }}>
        <Account
          address={address}
          localProvider={localProvider}
          userSigner={userSigner}
          mainnetProvider={mainnetProvider}
          price={price}
          web3Modal={web3Modal}
          loadWeb3Modal={loadWeb3Modal}
          logoutOfWeb3Modal={logoutOfWeb3Modal}
          blockExplorer={blockExplorer}
        />
        <FaucetHint localProvider={localProvider} targetNetwork={targetNetwork} address={address} />
      </div>

      {/* 🗺 Extra UI like gas price, eth price, faucet, and support: */}
      <div style={{ position: "fixed", textAlign: "left", left: 0, bottom: 20, padding: 10 }}>
        <Row align="middle" gutter={[4, 4]}>
          <Col span={8}>
            <Ramp price={price} address={address} networks={NETWORKS} />
          </Col>

          <Col span={8} style={{ textAlign: "center", opacity: 0.8 }}>
            <GasGauge gasPrice={gasPrice} />
          </Col>
          <Col span={8} style={{ textAlign: "center", opacity: 1 }}>
            <Button
              onClick={() => {
                window.open("https://t.me/joinchat/KByvmRe5wkR-8F_zz6AjpA");
              }}
              size="large"
              shape="round"
            >
              <span style={{ marginRight: 8 }} role="img" aria-label="support">
                💬
              </span>
              Support
            </Button>
          </Col>
        </Row>

        <Row align="middle" gutter={[4, 4]}>
          <Col span={24}>
            {
              /*  if the local provider has a signer, let's show the faucet:  */
              faucetAvailable ? (
                <Faucet localProvider={localProvider} price={price} ensProvider={mainnetProvider} />
              ) : (
                ""
              )
            }
          </Col>
        </Row>
      </div>
    </div>
  );
}

export default App;
