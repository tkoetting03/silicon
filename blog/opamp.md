In my quest to make verilog models out of a multitude of different SSI and MSI semiconductor products, I have now gotten to the operational amplifier. My primary inspiration for this design is the OPA4H199-SP from Texas Instruments. First I started with the basic function of an opamp which is the amplification of a signal by multiplying the voltage by the gain. 

```verilog
module OpAmp(
    input wire [15:0] Vin,
    output wire [15:0] Vout,
    input wire [15:0] Gain
);

    assign Vout = Gain * Vin;

endmodule
```
