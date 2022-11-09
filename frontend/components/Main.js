import { useEffect, useRef, useState } from 'react';
import { providers, Contract, utils } from 'ethers';
import Web3Modal from "web3modal";
import classes from '../styles/Home.module.css';
import { NFT_CONTRACT_ABI, NFT_CONTRACT_ADDRESS } from '../constants';

const Main = () => {
  const [presaleStarted, setPresaleStarted] = useState(false);
  const [presaleEnded, setPresaleEnded] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [tokenIdsMinted, setTokenIdsMinted] = useState("0");
  const [numTokensMinted, setNumTokensMinted] = useState("");
  const [loading, setLoading] = useState(false);
  const web3ModalRef = useRef();

  const getNumMintedTokens = async () => {
    try { 
      const provider = await getProviderOrSigner();

      // get an instance of the nft Contract
      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        NFT_CONTRACT_ABI,
        provider
      )

      const numTokenIds = await nftContract.tokenIds();  
      setNumTokensMinted(numTokenIds.toString())  
    } catch (error) {
      console.log({error})
    }
  }


  const presaleMint = async () => {
    setLoading(true)
    try {
      const signer = await getProviderOrSigner(true);
     
      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        NFT_CONTRACT_ABI,
        signer
      )

      const transaction = await nftContract.presaleMint({
        value: utils.parseEther("0.01")
      })
      setLoading(true);
      await transaction.wait();
      setLoading(false);
      window.alert('You succesfully minted a CryptoDev!')
      
    } catch (error) {
      console.log({error})
    }
    setLoading(false)
  }

  const publicMint = async () => {
    setLoading(true)
    try {
      const signer = await getProviderOrSigner(true);
     
      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        NFT_CONTRACT_ABI,
        signer
      )

      const transaction = await nftContract.mint({
        value: utils.parseEther("0.01")
      })
      
      setLoading(true);
      await transaction.wait();
      setLoading(false);
      window.alert('You succesfully minted a CryptoDev!')
    } catch (error) {
      console.log({error})
    }
    setLoading(false)
  }

  const getOwner = async () => {
    try {
      const signer = await getProviderOrSigner(true);
     
      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        NFT_CONTRACT_ABI,
        signer
      )
     
      const owner = await nftContract.owner();
        
      const userAddress = await signer.getAddress();

      if (owner.toLowerCase() === userAddress.toLowerCase()) {
        setIsOwner(true)
      }

    } catch (error) {
      console.log({error})
    }
  }

  const startPresale = async () => {
    setLoading(true)
    try {
      const signer = await getProviderOrSigner(true);
      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        NFT_CONTRACT_ABI,
        signer
      )
     
      const transaction = await nftContract.startPresale();
      await transaction.wait()

    } catch (error) {
      console.log({error})
    }
    setLoading(false)
  }

  const checkIfPresaleEnded = async () => {
    try { 
      const provider = await getProviderOrSigner();

      // get an instance of the nft Contract
      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        NFT_CONTRACT_ABI,
        provider
      )

      //it returns timestamp in seconds
      const presaleEndTime = await nftContract.presaleEnded();
      const currentTimeInSeconds = Date.now() / 1000  

      //lt() es para less than con un numro muy grande (uint256)
      const hasPresaleEnded = await presaleEndTime.lt(Math.floor(currentTimeInSeconds))

      setPresaleEnded(hasPresaleEnded)

    } catch (error) {
      console.log({error})
    }
  }

  const checkIfPresaleStarted = async () => {
    try {
      // Get the provider from web3Modal, which in our case is MetaMask
      // No need for the Signer here, as we are only reading state from the blockchain
      const provider = await getProviderOrSigner();
      // We connect to the Contract using a Provider, so we will only
      // have read-only access to the Contract
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, NFT_CONTRACT_ABI, provider);
      // call the presaleStarted from the contract
      const _presaleStarted = await nftContract.presaleStarted();
      if (!_presaleStarted) {
        await getOwner();
      }
      setPresaleStarted(_presaleStarted);
      return _presaleStarted;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const getTokenIdsMinted = async () => {
    try {
      // Get the provider from web3Modal, which in our case is MetaMask
      // No need for the Signer here, as we are only reading state from the blockchain
      const provider = await getProviderOrSigner();
      // We connect to the Contract using a Provider, so we will only
      // have read-only access to the Contract
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, provider);
      // call the tokenIds from the contract
      const _tokenIds = await nftContract.tokenIds();
      //_tokenIds is a `Big Number`. We need to convert the Big Number to a string
      setTokenIdsMinted(_tokenIds.toString());
    } catch (err) {
      console.error(err);
    }
  };

  const getProviderOrSigner = async (needSigner = false) => {
    try {
       //access to metamask provider/signer
      const provider = await web3ModalRef.current.connect();
      const web3Provider = new providers.Web3Provider(provider);
      
      //if the user is not connected to goerli network tell them to switch
      const { chainId } = await web3Provider.getNetwork()
      if (chainId !== 5) {
        window.alert('Change network to Goerli');
        throw new Error("Change network to Goerli");
      }

      if (needSigner) {
        const signer = web3Provider.getSigner();
        return signer;
      }

      return web3Provider
    } catch(error) {
      console.log({error})
    }
  }

  const connectWallet = async () => {
    try {
      await getProviderOrSigner();
      setWalletConnected(true);
    } catch(error) {
      console.log({error})
    }
  }

  const onPageLoad = async () => {
    await connectWallet()
    const presaleStarted = await checkIfPresaleStarted()
    if (presaleStarted) {
      await checkIfPresaleEnded()
    }
    await getNumMintedTokens();

    //track in real time the number of minted NFTs
    setInterval(async () => {
      await getNumMintedTokens();
    }, 10000)
    // track in real time the status of presale
    setInterval(async () => {
      const presaleStarted = await checkIfPresaleStarted();
      if (presaleStarted) await checkIfPresaleEnded();
    }, 10000)
  }

  useEffect(() => {
    if (!walletConnected) {
      web3ModalRef.current = new Web3Modal({
        network: "goerli",
        providerOptions: {},
        disableInjectedProvider: false

      })

      onPageLoad()
     
    }
  }, [])

  const renderBody = () => {

    if (loading) return <div className={classes.description}>Loading...</div>

    if (!walletConnected) return <button onClick={connectWallet} className={classes.button}>CONNECT YOUR WALLET</button>
    
    if (isOwner && !presaleStarted) return <button onClick={startPresale} className={classes.button}>START PRESALE</button>

    if (!isOwner && !presaleStarted) return <div className={classes.description}>PRESALE HASN'T STARTED</div>

    if (presaleStarted && !presaleEnded) return (
    <div>
      <p className={classes.description}>Presale has started, if your address is whitelisted you can mint a CryptoDev!</p>
      <button onClick={presaleMint} className={classes.button}>PRESALE MINT</button>
    </div>
   
    )

    if (presaleEnded) return (
      <div>
        <p className={classes.description}>Presale has ended, you can mint a CryptoDev in public sale</p>
        <button onClick={publicMint} className={classes.button}>PUBLIC MINT</button>
      </div>
     
      )
  }

  return ( 
    <main className={classes.main}>
    <div>
      <h1 className={classes.title}>Welcome to Crypto Devs!</h1>
      <div className={classes.description}>
        Its an NFT collection for developers in Crypto.
      </div>
      <div className={classes.description}>
        {numTokensMinted}/20 have been minted
      </div>
      {renderBody()}
    </div>
    <div>
      <img className={classes.image} src="/0.svg" />
    </div>
  </main>
   );
}
 
export default Main;