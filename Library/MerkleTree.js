class MerkleTree {

    constructor(leaves, hashFn){
        this.leaves = [];
        this.layers = [];
        this.hashFn = hashFn;
        this.processLeaves(leaves)
    }

    processLeaves(leaves) {
        this.leaves = leaves;
        this.layers = [this.leaves];
        this._createHashes(this.leaves);
    }

    //create merkle tree
    _createHashes(nodes) {
        while (nodes.length > 1) {
            const layerIndex = this.layers.length;
            this.layers.push([]);
            for (let i = 0; i < nodes.length; i += 2) {
                if (i + 1 === nodes.length) {
                    if (nodes.length % 2 === 1) {    
                        this.layers[layerIndex].push(nodes[i]);
                        continue;                            
                    }
                }
                const left = nodes[i];
                const right = i + 1 === nodes.length ? left : nodes[i + 1];
                let hash = this.hashFn(left, right);
                this.layers[layerIndex].push(hash);
            }
            nodes = this.layers[layerIndex];
        }
    }

    //get merkle root
    getRoot() {
        if (this.layers.length === 0) {
            return "";
        }
        return this.layers[this.layers.length - 1][0] || "";
    }


    //get proof and direction
    getProofAndDirection(leaf, index) {
        if (typeof leaf === 'undefined') {
            throw new Error('leaf is required');
        }
        const proof = [];
        const leftDirection =[];
        if (!Number.isInteger(index)) {
            index = -1;
            for (let i = 0; i < this.leaves.length; i++) {
                if (leaf === this.leaves[i]){
                    index = i;
                }
            }
        }
        if (index <= -1) {
            return [];
        }

        for (let i = 0; i < this.layers.length; i++) {
            const layer = this.layers[i];      
            const isRightNode = index % 2;
            const pairIndex = isRightNode ? index - 1: index + 1;
            if (pairIndex < layer.length) {
                proof.push(                    
                    layer[pairIndex]
                );

                leftDirection.push(!isRightNode);
            }
            // set index to parent index
            index = (index / 2) | 0;
        }
        return {proof, leftDirection};
    }

    //verify leads
    verify(proof, leftDirection, targetNode, root) {
        let hash = targetNode;
        root = root;
        if (!Array.isArray(proof) ||!targetNode ||!root) {
            return false;
        }
        for (let i = 0; i < proof.length; i++) {
            const node = proof[i];
            let data = node;
            if(leftDirection[i]){
                hash = this.hashFn(hash, data);
            }else{
                hash = this.hashFn(data, hash);
            }        
        }
        return hash == root;
    }

}

module.exports = MerkleTree;