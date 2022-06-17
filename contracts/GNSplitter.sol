// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/interfaces/IERC20.sol';

contract GNSplitter is Ownable {
  struct Receiver {
    address wallet;
    uint8 weight;
  }

  Receiver[] public receivers;
  uint256 public overallWeight;

  function getAllReceivers() external view returns (Receiver[] memory) {
    return receivers;
  }

  function addWallet(address _wallet, uint8 _weight) external onlyOwner {
    receivers.push(Receiver({ wallet: _wallet, weight: _weight }));
    overallWeight += _weight;
  }

  function removeWallet(uint256 _index) external onlyOwner {
    Receiver memory _wallet = receivers[_index];
    overallWeight -= _wallet.weight;
    receivers[_index] = receivers[receivers.length - 1];
    receivers.pop();
  }

  function withdrawTokens(address _tokenAddy, uint256 _amount)
    external
    onlyOwner
  {
    IERC20 _token = IERC20(_tokenAddy);
    _amount = _amount > 0 ? _amount : _token.balanceOf(address(this));
    require(_amount > 0, 'make sure there is a balance available to withdraw');
    _token.transfer(owner(), _amount);
  }

  function withdrawETH() external onlyOwner {
    payable(owner()).call{ value: address(this).balance }('');
  }

  receive() external payable {
    for (uint256 _i = 0; _i < receivers.length; _i++) {
      Receiver memory _rec = receivers[_i];
      payable(_rec.wallet).call{
        value: (msg.value * _rec.weight) / overallWeight
      }('');
    }
  }
}