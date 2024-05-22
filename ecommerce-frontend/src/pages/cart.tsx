import axios from "axios";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { VscError } from "react-icons/vsc";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import CartItemCard from "../components/cart-item";
import { addToCart, applyDiscount, calculatePrice, removeFromCart } from "../redux/reducer/cartReducer";
import { server } from "../redux/store";
import { CartReducerInitialState } from "../types/reducer-types";
import { CartItem } from "../types/types";


const Cart = () => {

  const {cartItems,subTotal,tax,discount,total,shippingCharges} = 
  useSelector((state:{cartReducer: CartReducerInitialState})=> state.cartReducer);


    const [couponCode,setCouponCode] = useState<string>("");
    const [isValidCouponCode,setIsValidCouponCode] = useState<boolean>(false);

    const dispatch = useDispatch();

    const incrementHandler=(cartItem: CartItem)=>{
        if(cartItem.quantity >= cartItem.stock) return toast.error("Requested Quantity cannot be met");

      dispatch(addToCart({...cartItem, quantity: cartItem.quantity+1}));
    }

    const decrementHandler=(cartItem: CartItem)=>{
        if(cartItem.quantity <= 1) return;
    
          dispatch(addToCart({...cartItem, quantity: cartItem.quantity-1}));
        }

    const removeHandler=(productId: string)=>{
        
        dispatch(removeFromCart(productId));
    }

    useEffect(()=>{

        const {token: cancelToken, cancel} = axios.CancelToken.source();

        const timeOutId= setTimeout(()=> {

            axios.get(`${server}/api/v1/payment/discount?coupon=${couponCode}`,{
                cancelToken,
            })
            .then((res) => {
                dispatch(applyDiscount(res.data.discount));
                setIsValidCouponCode(true);
                dispatch(calculatePrice());
            })
            .catch(() => {
                dispatch(applyDiscount(0));
                setIsValidCouponCode(false);
                dispatch(calculatePrice());
            });
        }, 0);

        return()=>{
            clearTimeout(timeOutId);
            cancel();
            setIsValidCouponCode(false);
        }
    }, [couponCode])

    useEffect(() => {
      dispatch(calculatePrice());
    }, [cartItems]);
    

  return (
    <div className="cart">
        <main>

            {
                cartItems.length > 0 ? cartItems.map((i,idx)=> (
                    <CartItemCard incrementHandler={incrementHandler} decrementHandler={decrementHandler}
                    removeHandler={removeHandler} key={idx} cartItem={i}/>
                )
                ) : 
                <h1>No Items Added</h1>
            }






        </main>







        <aside>
            <p>Subtotal: ₹{subTotal}</p>
            <p>Shipping Charges: ₹{shippingCharges}</p>
            <p>Tax: ₹{tax}</p>
            <p>
                Discount:  <em className="red"> - ₹{discount}</em>
            </p>
            <p>
                <b>
                    Total: ₹{total}
                </b>
            </p>

            <input 
            type="text" 
            placeholder="Coupon Code"
            value={couponCode} 
            onChange={e=>setCouponCode(e.target.value)} 
            />

            {
                couponCode && 
                (isValidCouponCode? 
                (
                <span className="green">₹{discount} off using the
                <code>{couponCode}</code></span>
                ) :
                ( 
                <span className="red">
                Invalid Coupon <VscError />
                </span>
                )
                )
            }


            {
                cartItems.length > 0 && <Link to={"/shipping"}>Checkout</Link>
            }

        </aside>
    </div>
  )
}

export default Cart;