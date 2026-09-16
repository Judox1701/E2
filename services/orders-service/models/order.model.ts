export default class Order {
    public id: number
    public productId: number
    public quantity: number
    public price: number

    constructor(id: number, productId: number, quantity: number, price: number) {
        this.id = id
        this.productId = productId
        this.quantity = quantity
        this.price = price
    }
}