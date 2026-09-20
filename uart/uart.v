// =============================================================================
// UART — Universal Asynchronous Receiver/Transmitter
// Educational Verilog model for Silicon · Thomas Koetting
// Frame: 1 start bit (0) · 8 data bits · 1 stop bit (1) · no parity
// =============================================================================

module baud_gen #(
    parameter integer CLK_HZ  = 50_000_000,
    parameter integer BAUD    = 115_200,
    parameter integer OVERSAMPLE = 16
)(
    input  wire clk,
    input  wire rst_n,
    output reg  tick        // pulses OVERSAMPLE times per bit period
);
    localparam integer DIV = CLK_HZ / (BAUD * OVERSAMPLE);
    reg [$clog2(DIV)-1:0] cnt;

    always @(posedge clk or negedge rst_n) begin
        if (!rst_n) begin
            cnt  <= 0;
            tick <= 1'b0;
        end else if (cnt == DIV - 1) begin
            cnt  <= 0;
            tick <= 1'b1;
        end else begin
            cnt  <= cnt + 1'b1;
            tick <= 1'b0;
        end
    end
endmodule


module uart_tx (
    input  wire       clk,
    input  wire       rst_n,
    input  wire       tick,       // baud × oversample tick
    input  wire       tx_start,
    input  wire [7:0] tx_data,
    output reg        tx,
    output wire       busy
);
    localparam IDLE  = 2'd0;
    localparam START = 2'd1;
    localparam DATA  = 2'd2;
    localparam STOP  = 2'd3;

    reg [1:0] state;
    reg [3:0] tick_cnt;   // counts oversample ticks within a bit
    reg [2:0] bit_idx;
    reg [7:0] shift;

    assign busy = (state != IDLE);

    always @(posedge clk or negedge rst_n) begin
        if (!rst_n) begin
            state    <= IDLE;
            tx       <= 1'b1;     // line idle high
            tick_cnt <= 0;
            bit_idx  <= 0;
            shift    <= 0;
        end else begin
            case (state)
                IDLE: begin
                    tx <= 1'b1;
                    if (tx_start) begin
                        shift    <= tx_data;
                        tick_cnt <= 0;
                        state    <= START;
                    end
                end
                START: if (tick) begin
                    tx <= 1'b0;               // start bit
                    if (tick_cnt == 4'd15) begin
                        tick_cnt <= 0;
                        bit_idx  <= 0;
                        state    <= DATA;
                    end else
                        tick_cnt <= tick_cnt + 1'b1;
                end
                DATA: if (tick) begin
                    tx <= shift[0];
                    if (tick_cnt == 4'd15) begin
                        tick_cnt <= 0;
                        shift    <= {1'b0, shift[7:1]};
                        if (bit_idx == 3'd7)
                            state <= STOP;
                        else
                            bit_idx <= bit_idx + 1'b1;
                    end else
                        tick_cnt <= tick_cnt + 1'b1;
                end
                STOP: if (tick) begin
                    tx <= 1'b1;               // stop bit
                    if (tick_cnt == 4'd15) begin
                        tick_cnt <= 0;
                        state    <= IDLE;
                    end else
                        tick_cnt <= tick_cnt + 1'b1;
                end
            endcase
        end
    end
endmodule


module uart_rx (
    input  wire       clk,
    input  wire       rst_n,
    input  wire       tick,
    input  wire       rx,          // serial in (idle high)
    output reg  [7:0] rx_data,
    output reg        rx_valid,
    output reg        framing_err
);
    localparam IDLE  = 2'd0;
    localparam START = 2'd1;
    localparam DATA  = 2'd2;
    localparam STOP  = 2'd3;

    reg [1:0] state;
    reg [3:0] tick_cnt;
    reg [2:0] bit_idx;
    reg [7:0] shift;

    always @(posedge clk or negedge rst_n) begin
        if (!rst_n) begin
            state       <= IDLE;
            rx_data     <= 0;
            rx_valid    <= 1'b0;
            framing_err <= 1'b0;
            tick_cnt    <= 0;
            bit_idx     <= 0;
            shift       <= 0;
        end else begin
            rx_valid <= 1'b0;
            case (state)
                IDLE: if (tick && rx == 1'b0) begin
                    // falling edge — candidate start bit
                    tick_cnt <= 0;
                    state    <= START;
                end
                START: if (tick) begin
                    // sample mid-bit (tick 7 of 16)
                    if (tick_cnt == 4'd7) begin
                        if (rx == 1'b0) begin
                            tick_cnt <= 0;
                            bit_idx  <= 0;
                            state    <= DATA;
                        end else
                            state <= IDLE; // false start
                    end else
                        tick_cnt <= tick_cnt + 1'b1;
                end
                DATA: if (tick) begin
                    if (tick_cnt == 4'd15) begin
                        tick_cnt <= 0;
                        shift    <= {rx, shift[7:1]};
                        if (bit_idx == 3'd7)
                            state <= STOP;
                        else
                            bit_idx <= bit_idx + 1'b1;
                    end else
                        tick_cnt <= tick_cnt + 1'b1;
                end
                STOP: if (tick) begin
                    if (tick_cnt == 4'd7) begin
                        framing_err <= (rx != 1'b1);
                        rx_data     <= shift;
                        rx_valid    <= 1'b1;
                        tick_cnt    <= 0;
                        state       <= IDLE;
                    end else
                        tick_cnt <= tick_cnt + 1'b1;
                end
            endcase
        end
    end
endmodule


// Top-level glue — one TX + one RX sharing a baud generator
module uart #(
    parameter integer CLK_HZ = 50_000_000,
    parameter integer BAUD   = 115_200
)(
    input  wire       clk,
    input  wire       rst_n,
    // TX side
    input  wire       tx_start,
    input  wire [7:0] tx_data,
    output wire       tx,
    output wire       tx_busy,
    // RX side
    input  wire       rx,
    output wire [7:0] rx_data,
    output wire       rx_valid,
    output wire       framing_err
);
    wire tick;

    baud_gen #(.CLK_HZ(CLK_HZ), .BAUD(BAUD)) u_baud (
        .clk(clk), .rst_n(rst_n), .tick(tick)
    );

    uart_tx u_tx (
        .clk(clk), .rst_n(rst_n), .tick(tick),
        .tx_start(tx_start), .tx_data(tx_data),
        .tx(tx), .busy(tx_busy)
    );

    uart_rx u_rx (
        .clk(clk), .rst_n(rst_n), .tick(tick),
        .rx(rx), .rx_data(rx_data),
        .rx_valid(rx_valid), .framing_err(framing_err)
    );
endmodule
