```verilog
module OpAmp(
    input wire [15:0] Vin,
    output wire [15:0] Vout,
    input wire [15:0] Gain
);

    assign Vout = Gain * Vin;

endmodule
```
