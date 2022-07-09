pragma solidity ^0.8.0;
//SPDX-License-Identifier: MIT

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "base64-sol/base64.sol";

import "./HexStrings.sol";
import "./ToColor.sol";

//learn more: https://docs.openzeppelin.com/contracts/3.x/erc721

// GET LISTED ON OPENSEA: https://testnets.opensea.io/get-listed/step-two

contract Loogies is ERC721Enumerable, Ownable {
    using Strings for uint256;
    using HexStrings for uint160;
    using ToColor for bytes3;
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;
    // all funds go to buidlguidl.eth
    address payable public constant recipient =
        payable(0x8f9b1b9EAabE5A1CAd1C432Cb9AE03B9840661de);
    uint256 public constant limit = 25;
    uint256 public constant curve = 1050; 
    uint256 public price = 0.001 ether;
    mapping(uint256 => bytes3) public color;
    mapping(uint256 => uint256) public chubbiness;
    mapping(uint256 => uint256) public mouthLength;
    mapping(uint256 => uint256) public truthSeekerById;

    constructor() public ERC721("OptimisticLoogies", "OPLOOG") {}

    function mintItem() public payable returns (uint256) {
        require(_tokenIds.current() < limit, "DONE MINTING");
        require(msg.value >= price, "NOT ENOUGH");

        price = (price * curve) / 1000;

        _tokenIds.increment();

        uint256 id = _tokenIds.current();
        _mint(msg.sender, id);

        bytes32 predictableRandom = keccak256(
            abi.encodePacked(
                id,
                blockhash(block.number - 1),
                msg.sender,
                address(this)
            )
        );
        color[id] =
            bytes2(predictableRandom[0]) |
            (bytes2(predictableRandom[1]) >> 8) |
            (bytes3(predictableRandom[2]) >> 16);
        chubbiness[id] =
            35 +
            ((55 * uint256(uint8(predictableRandom[3]))) / 255);
        // small chubiness loogies have small mouth
        mouthLength[id] =
            180 +
            ((uint256(chubbiness[id] / 4) *
                uint256(uint8(predictableRandom[4]))) / 255);

        (bool success, ) = recipient.call{value: msg.value}("");
        require(success, "could not send");

        return id;
    }

    function tokenURI(uint256 id) public view override returns (string memory) {
        require(_exists(id), "not exist");
        string memory name = string(
            abi.encodePacked("Skull #", id.toString())
        );
        string memory description = string(
            abi.encodePacked(
                "Skull color #",
                color[id].toColor()//,
                //" with a of ",
                //uint2str(chubbiness[id]),
                //" and length of ",
                //uint2str(mouthLength[id]),
                //"!!!"
            )
        );
        string memory image = Base64.encode(bytes(generateSVGofTokenById(id)));

        return
            string(
                abi.encodePacked(
                    "data:application/json;base64,",
                    Base64.encode(
                        bytes(
                            abi.encodePacked(
                                '{"name":"',
                                name,
                                '", "description":"',
                                description,
                                '", "external_url":"https://burnyboys.com/token/',
                                id.toString(),
                                '", "attributes": [{"trait_type": "color", "value": "#',
                                color[id].toColor(),
                                '"},{"trait_type": "chubbiness", "value": ',
                                uint2str(chubbiness[id]),
                                '},{"trait_type": "mouthLength", "value": ',
                                uint2str(mouthLength[id]),
                                '}], "owner":"',
                                (uint160(ownerOf(id))).toHexString(20),
                                '", "image": "',
                                "data:image/svg+xml;base64,",
                                image,
                                '"}'
                            )
                        )
                    )
                )
            );
    }

    function generateSVGofTokenById(uint256 id)
        internal
        view
        returns (string memory)
    {
        string memory svg = string(
            abi.encodePacked(
           '<svg width="400" height="400"   xmlns="http://www.w3.org/2000/svg">',
                renderTokenById(id),
                "</svg>"
            )
        );

        return svg;
    }

    // Visibility is `public` to enable it being called by other contracts for composition.
    function renderTokenById(uint256 id) public view returns (string memory) {
        string memory animate = "";

        animate = '<animateTransform attributeName="transform" attributeType="XML" type="rotate" from="0 235 245" to="360 235 245" begin="0s" dur="2s" repeatCount="indefinite" additive="sum" />';

        string memory render;

        render = string(
            abi.encodePacked(
              '<g transform="translate(0.000000,400.000000) scale(0.100000,-0.100000)" fill="#',color[id].toColor(),'" stroke="none" >',
'<path d="M1680 3724 c-239 -51 -521 -215 -722 -421 -165 -169 -200 -325 -138 -622 26 -126 157 -567 200 -677 17 -43 48 -108 67 -144 43 -78 123 -193 130 -187 2 3 -17 34 -42 69 -110 148 -206 403 -321 847 -101 393 -62 560 180 773 210 184 453 314 664 354 441 84 1021 -193 1198 -571 69 -149 83 -212 104 -479 7 -76 16 -148 21 -160 7 -17 8 -16 4 9 -3 17 -12 111 -20 210 -8 99 -21 205 -29 236 -42 159 -118 298 -224 406 -165 171 -443 315 -691 358 -104 18 -294 18 -381 -1z"/>',
'<path d="M2845 2315 c-38 -13 -65 -23 -60 -24 13 -1 146 37 153 44 10 10 -24 3 -93 -20z"/>',
'<path d="M1545 2262 c0 -40 -7 -70 -22 -99 -13 -24 -32 -61 -44 -83 -15 -28 -25 -77 -34 -170 -8 -72 -21 -145 -30 -162 -8 -17 -13 -33 -11 -36 15 -14 38 75 50 193 8 74 21 148 29 163 8 15 27 49 42 75 19 34 29 68 33 113 2 35 1 64 -4 64 -5 0 -9 -26 -9 -58z"/>',
'<path d="M3015 2266 c-3 -9 -7 -23 -10 -31 -2 -8 -2 -15 1 -15 7 0 25 52 20 58 -3 3 -8 -3 -11 -12z"/>',
'<path d="M1940 2151 c-149 -21 -253 -57 -293 -102 -16 -17 -25 -34 -21 -37 4 -4 9 -1 12 7 3 8 16 25 30 38 60 56 356 112 477 90 25 -4 32 -3 20 2 -43 18 -105 19 -225 2z"/>',
'<path d="M2620 2148 c-12 -22 -12 -22 6 -6 10 10 15 20 12 24 -4 3 -12 -5 -18 -18z"/>',
'<path d="M3010 2136 c0 -8 4 -17 9 -20 5 -4 7 3 4 14 -6 23 -13 26 -13 6z"/>',
'<path d="M3031 1888 c-1 -144 -15 -187 -69 -212 -52 -25 -134 -78 -128 -83 2 -3 24 9 48 25 24 16 60 37 80 45 59 25 72 55 76 176 2 58 2 120 -1 136 -2 17 -5 -23 -6 -87z"/>',
'<path d="M1130 1928 c0 -4 13 -36 29 -70 17 -35 32 -75 36 -90 7 -36 113 -177 196 -261 94 -94 149 -118 285 -123 58 -2 114 -6 125 -9 11 -4 19 -2 19 4 0 12 -8 13 -152 16 -130 2 -178 26 -287 141 -105 111 -165 196 -185 264 -14 48 -66 148 -66 128z"/>',
'<path d="M2538 1813 c6 -2 18 -2 25 0 6 3 1 5 -13 5 -14 0 -19 -2 -12 -5z"/>',
'<path d="M2396 1694 c-13 -35 -4 -75 35 -154 23 -45 43 -80 45 -77 2 2 -12 35 -32 73 -26 51 -35 83 -36 122 -2 56 -3 60 -12 36z"/>',
'<path d="M1366 1428 c19 -57 41 -141 50 -188 34 -182 108 -287 358 -501 176 -151 333 -264 452 -325 104 -54 143 -56 300 -15 199 53 209 61 224 192 9 80 15 717 6 708 -2 -2 -7 -80 -10 -174 -3 -93 -8 -183 -11 -200 -4 -25 -4 -27 5 -10 16 32 1 -363 -15 -402 -19 -45 -59 -66 -194 -102 -140 -37 -187 -38 -262 -7 -167 68 -596 410 -724 575 -64 85 -96 153 -117 254 -21 107 -79 297 -89 297 -4 0 8 -46 27 -102z"/>',
'<path d="M2762 1484 c-19 -75 -21 -87 -13 -78 10 12 33 106 27 111 -3 3 -9 -12 -14 -33z"/>',
'<path d="M2752 1355 c0 -16 2 -22 5 -12 2 9 2 23 0 30 -3 6 -5 -1 -5 -18z"/>',
'<path d="M1850 1365 c0 -5 5 -17 10 -25 5 -8 10 -10 10 -5 0 6 -5 17 -10 25 -5 8 -10 11 -10 5z"/>',
'<path d="M1882 1275 c0 -16 4 -41 8 -55 l8 -25 0 25 c0 14 -4 39 -8 55 l-8 30 0 -30z"/>',
'</g >'
            )
        );

        return render;
    }

    function uint2str(uint256 _i)
        internal
        pure
        returns (string memory _uintAsString)
    {
        if (_i == 0) {
            return "0";
        }
        uint256 j = _i;
        uint256 len;
        while (j != 0) {
            len++;
            j /= 10;
        }
        bytes memory bstr = new bytes(len);
        uint256 k = len;
        while (_i != 0) {
            k = k - 1;
            uint8 temp = (48 + uint8(_i - (_i / 10) * 10));
            bytes1 b1 = bytes1(temp);
            bstr[k] = b1;
            _i /= 10;
        }
        return string(bstr);
    }
}
