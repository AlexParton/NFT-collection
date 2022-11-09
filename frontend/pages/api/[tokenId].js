// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

export default function handler(req, res) {
  const tokenId = req.query.tokenId;
  const name = `Crypto Dev #${tokenId}`;
  const description = 'Crypto Devs is an NFT collection for web3 developers';
  const image = `https://raw.githubusercontent.com/LearnWeb3DAO/NFT-Collection/main/my-app/public/cryptodevs/${+tokenId-1}.svg`;

  return res.json({
    name: name,
    description: description,
    image: image
  })
}
