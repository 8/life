class DataModel {
  columns: number;
  rows: number;
  cells: Array<boolean[]>;

  constructor(columns: number, rows: number) {
    this.columns = columns; this.rows = rows;
    this.cells = this.getCells(columns, rows)
  }

  private getCells(columns: number, rows: number): Array<boolean[]> {
    const cells = new Array<boolean[]>(columns);
    for (let c = 0; c < columns; c++) {
      cells[c] = new Array<boolean>(rows);
    }
    return cells;
  }
}

class StyleModel {
  cellWidth: number = 15;
  cellHeight: number = 15;
  cellMargin: number = 1;
  deadCellFillColor: string = 'white';
  aliveCellFillColor: string = 'green';
  backgroundColor: string = 'black';
}

class App {

  private data: DataModel;
  private readonly style: StyleModel;
  private readonly canvas: HTMLCanvasElement;
  private readonly context: CanvasRenderingContext2D;
  private timer: number = null;
  private interval: number = 1000;

  constructor() {
    this.data = new DataModel(93, 100);
    this.style = new StyleModel();
    this.canvas = document.getElementById('canvas') as HTMLCanvasElement;
    this.context = this.canvas.getContext("2d");
  }

  run() {
    const data = this.data;
    const style = this.style;
    const canvas = this.canvas;
    const context = this.context;

    /* resize the canvas */
    canvas.width = data.columns * (style.cellWidth + style.cellMargin) + style.cellMargin;
    canvas.height = data.rows * (style.cellHeight + style.cellMargin) + style.cellMargin;


    this.subscribeMouse();
    this.subscribeButtons();
    this.subscribeSlider();

    this.draw()
  }

  private subscribeSlider() {
    const input = document.getElementById('interval') as HTMLInputElement;
    input.addEventListener('change', ev => this.changeInterval(input.valueAsNumber));
  }

  private changeInterval(interval: number) {
    this.interval = interval;
    this.pause();
    this.play();
  }

  private subscribeButtons() {
    document.getElementById('play').addEventListener('click', () => this.play());
    document.getElementById('pause').addEventListener('click', () => this.pause());
    document.getElementById('reset').addEventListener('click', () => this.reset());
    document.getElementById('forward').addEventListener('click', () => this.forward());
  }

  private forward() {
    this.evolve();
    this.draw();
  }

  private play() {
    if (this.timer === null) {
      this.timer = setInterval(() => this.timerTicker(), this.interval)
    }
  }
  
  private pause() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private timerTicker() {
    this.evolve();
    this.draw();
  }

  private reset() {
    const d = this.data;
    for (let c = 0; c < d.cells.length; c++) {
      for (let r = 0; r < d.cells[c].length; r++) {
        d.cells[c][r] = false;
      }
    }
    this.draw();
  }

  private subscribeMouse() {

    /* toggle on click */
    this.canvas.addEventListener('click', ev => {

      const x = ev.clientX - this.canvas.offsetLeft;
      const y = ev.clientY - this.canvas.offsetTop;
      // console.log(x, y);

      const cell = this.getCellAt(x, y, this.style);

      this.data.cells[cell.column][cell.row] = !this.data.cells[cell.column][cell.row];

      /* redraw */
      this.draw();
    });
  }

  private getCellAt(x: number, y: number, style: StyleModel) {
    return {
      column: Math.floor(x / (style.cellWidth + style.cellMargin)),
      row: Math.floor(y / (style.cellHeight + style.cellMargin))
    }
  }

  private getLiveNeighbours(column: number, row: number, data: DataModel) {

    var count = 0;
    for (let c = Math.max(0, column - 1); c < Math.min(data.columns, column + 2); c++) {
      for (let r = Math.max(0, row - 1); r < Math.min(data.rows, row + 2); r++) {
        if (!(c === column && r === row)) { /* ignore the cell in question */
          if (data.cells[c][r]) {
            count++;
          }
        }
      }
    }
    return count;
  }

  private evolve() {
    this.data = this.getEvolved(this.data);
  }

  private getEvolved(data: DataModel): DataModel {

    /* evolve the model */

    // 1. Any live cell with fewer than two live neighbours dies, as if caused by underpopulation.
    // 2. Any live cell with two or three live neighbours lives on to the next generation.
    // 3. Any live cell with more than three live neighbours dies, as if by overpopulation.
    // 4. Any dead cell with exactly three live neighbours becomes a live cell, as if by reproduction.

    /* create */
    const ret = new DataModel(data.columns, data.rows);

    for (let c = 0; c < data.columns; c++) {
      for (let r = 0; r < data.rows; r++) {
        
        const count = this.getLiveNeighbours(c, r, data);

        if (data.cells[c][r]) {
          ret.cells[c][r] = (count == 2 || count == 3);
        } else {
          ret.cells[c][r] = (count == 3);
        }
      }
    }

    return ret;
  }

  draw() {

    /* clear the canvas */
    this.context.fillStyle = this.style.backgroundColor;
    this.context.fillRect(0, 0, this.context.canvas.width, this.context.canvas.height);

    /* draw the cells */
    for (let c = 0; c < this.data.cells.length; c++) {
      for (let r = 0; r < this.data.cells[c].length; r++) {
        
        /* choose color according to it's state */
        this.context.fillStyle = this.data.cells[c][r] ? this.style.aliveCellFillColor : this.style.deadCellFillColor;

        this.context.fillRect(
          c * (this.style.cellWidth + this.style.cellMargin) + this.style.cellMargin,
          r * (this.style.cellHeight + this.style.cellMargin) + this.style.cellMargin,
          this.style.cellWidth,
          this.style.cellHeight);
      }
    }
  }

}

new App().run();