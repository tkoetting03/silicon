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

This is an _ideal_ and _general_ opamp that has no resistance, slew, feedback, or added complexity to achieve specific results. During creation I asked myself whether I wanted an opamp that would be created in perfect immitation of the real deal or one which is the _perfect abstract model_. I settled upon the latter, as immitating real world constraints with test benches and design features was not my goal in creating the verilog opamp. 

We have to consider, then, ideal variables for the opamp as to create the _perfect abstract model_ as I have discussed. Finding the characteristics and specifications turned out to be easier than I thought thanks to documentation from many different power semiconductor manufacturers like [Texas Instruments](https://www.ti.com.cn/cn/lit/an/slaa068b/slaa068b.pdf) and [Toshiba](https://toshiba.semicon-storage.com/us/semiconductor/knowledge/faq/linear_opamp/what-is-the-ideal-op-amp.html), along with my very own [University of Kansas](www.ittc.ku.edu/~jstiles/412/handouts/2.1 The ideal op-amp/The Ideal Operational Amplifier lecture.pdf).

