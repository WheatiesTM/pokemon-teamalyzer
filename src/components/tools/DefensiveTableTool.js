import React from 'react';
import { TYPE_CHART, Pokemon, calculate, Move, Field } from '@smogon/calc';
import { gen, validSpecies } from '../../utils';
import { observer } from 'mobx-react';
import styled from 'styled-components';
import 'mobx-react-lite/batchingForReactDom';
import DefensiveTable from './DefensiveTable';

const Styles = styled.div`
  padding: 1rem;

  table {
    border-spacing: 0;
    border: 1px solid black;

    tr {
      :last-child {
        td {
          border-bottom: 0;
        }
      }
    }

    th,
    td {
      margin: 0;
      padding: 0rem;
      border-bottom: 1px solid black;
      border-right: 1px solid black;

      :last-child {
        border-right: 0;
      }
    }
  }
`;

@observer
class DefensiveTableTool extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      data: this.genData(this.category),
      columns: this.genColumns(),
      category: 'Physical',
      maxDamage: 100,
    };
  }

  calcDamage(type, poke, fieldState, category) {
    if (poke.include && validSpecies(poke.species)) {
      const defender = new Pokemon(gen, poke.species, {
        level: +this.props.teamState.level,
        item: poke.item,
        nature: poke.nature,
        gender: poke.gender,
        isDynamaxed: poke.isMax,
        ability: poke.ability,
        abilityOn: poke.abilityOn,
        status: poke.status,
        ivs: {
          hp: +poke.ivVals[0],
          atk: +poke.ivVals[1],
          def: +poke.ivVals[2],
          spa: +poke.ivVals[3],
          spd: +poke.ivVals[4],
          spe: +poke.ivVals[5],
        },
        evs: {
          hp: +poke.evVals[0],
          atk: +poke.evVals[1],
          def: +poke.evVals[2],
          spa: +poke.evVals[3],
          spd: +poke.evVals[4],
          spe: +poke.evVals[5],
        },
        boosts: {
          atk: +poke.boosts[1],
          def: +poke.boosts[2],
          spa: +poke.boosts[3],
          spd: +poke.boosts[4],
          spe: +poke.boosts[5],
        },
      });

      const attacker = new Pokemon(gen, 'Ditto', {
        level: +this.props.teamState.level,
        nature: 'Serious',
        //NOTE conditional stops STAB effect on damage results
        overrides: { types: type === '???' ? 'Normal' : '???' },
      });

      const spAttack = new Move(gen, 'Explosion', { overrides: { type: type, category: 'Special' } });
      const phAttack = new Move(gen, 'Explosion', { overrides: { type: type } });

      let aSide = fieldState.sides[1];
      let dSide = fieldState.sides[0];
      const field = new Field({
        gameType: fieldState.format,
        weather: fieldState.weather,
        terrain: fieldState.terrain,
        isGravity: fieldState.gravity,
        defenderSide: {
          spikes: dSide.spikes,
          steelsurge: dSide.steelsurge,
          isSR: dSide.stealthrock,
          isReflect: dSide.reflect,
          isLightScreen: dSide.lightscreen,
          isProtected: dSide.protect,
          isSeeded: dSide.leechseed,
          isForesight: dSide.foresight,
          isTailwind: dSide.tailwind,
          isHelpingHand: dSide.helpinghand,
          isFriendGuard: dSide.friendguard,
          isAuroraVeil: dSide.auroraveil,
          isBattery: dSide.battery,
          isSwitching: dSide.switching,
        },
        attackerSide: {
          spikes: aSide.spikes,
          steelsurge: aSide.steelsurge,
          isSR: aSide.stealthrock,
          isReflect: aSide.reflect,
          isLightScreen: aSide.lightscreen,
          isProtected: aSide.protect,
          isSeeded: aSide.leechseed,
          isForesight: aSide.foresight,
          isTailwind: aSide.tailwind,
          isHelpingHand: aSide.helpinghand,
          isFriendGuard: aSide.friendguard,
          isAuroraVeil: aSide.auroraveil,
          isBattery: aSide.battery,
          isSwitching: aSide.switching,
        },
      });

      //NOTE damage returned is maximum roll
      let phResult = calculate(gen, attacker, defender, phAttack, field);
      let phPerc = +((phResult.range()[1] / defender.maxHP()) * 100).toFixed(1);

      let spResult = calculate(gen, attacker, defender, spAttack, field);
      let spPerc = +((spResult.range()[1] / defender.maxHP()) * 100).toFixed(1);

      switch (category) {
        case 'Physical':
          return phPerc;
        case 'Special':
          return spPerc;
        case 'Both':
          return +((spPerc + phPerc) / 2).toFixed(1);
      }
    } else {
      return 0;
    }
  }

  avgTypeDamage(atkType, category) {
    let dmgArray = this.props.teamState.team.map((poke, index) =>
      this.calcDamage(atkType, poke, this.props.teamState.field, category)
    );
    let dmgTotal = dmgArray.reduce((accumulator, currentValue) => accumulator + currentValue);
    let activePoke = this.props.teamState.team
      .map(poke => {
        return poke.include && validSpecies(poke.species);
      })
      .reduce((accumulator, currentValue) => accumulator + currentValue);
    activePoke = activePoke == 0 ? 1 : activePoke;
    return +(dmgTotal / activePoke).toFixed(1);
  }

  //TODO getAvgAcrTypes
  getAvgAcrTypes(damageData, index) {
    columnTotal = 0;
    for (let type in damageData) {
      columnTotal += damageData[type][index];
    }
    for (let type in damageData) {
      columnTotal += damageData[type][index];
    }
  }

  //TODO add row where average damage taken by each pokemon across all types is calculated
  genData(category) {
    let damageData = Object.keys(TYPE_CHART[gen]).map(atkType => {
      let row = { rowTitle: atkType };
      this.props.teamState.team.map((poke, index) => {
        row[index] = this.calcDamage(atkType, poke, this.props.teamState.field, category);
      });
      row.avgTypeDmg = this.avgTypeDamage(atkType, category);
      return row;
    });

    // //create average row
    // let colAvg = { ...damageData[0] };
    // //TODO write function to calc average values based on data array
    // colAvg.rowTitle = 'Average';
    // damageData.push(colAvg);
    this.setMaxDamage(damageData);
    return damageData;
  }

  setMaxDamage(damageData) {
    let max = Math.max(
      ...damageData.map(row => Math.max(...Object.values(row).filter(element => typeof element != 'string')))
    );
    this.setState({ maxDamage: max });
  }

  genColumns() {
    let teamCols = this.props.teamState.team.map((pokemon, index) => ({
      Header: pokemon.species,
      accessor: String(index),
    }));
    teamCols.unshift({ Header: 'Attack Type', accessor: 'rowTitle' });
    teamCols.push({ Header: 'Average Type Damage', accessor: 'avgTypeDmg' });
    return teamCols;
  }

  updateData(category) {
    this.setState({ data: this.genData(category), columns: this.genColumns() });
  }

  render() {
    return (
      <div>
        <label>Defense Analyzer</label>
        <br />
        <div title="Select defense category.">
          <label>
            <input
              type="radio"
              value="Physical"
              checked={this.state.category === 'Physical'}
              onChange={event => {
                this.setState({ category: event.target.value });
                this.updateData(event.target.value);
              }}
            />
            Physical
          </label>
          <label>
            <input
              type="radio"
              value="Special"
              checked={this.state.category === 'Special'}
              onChange={event => {
                this.setState({ category: event.target.value });
                this.updateData(event.target.value);
              }}
            />
            Special
          </label>
          <label>
            <input
              type="radio"
              value="Both"
              checked={this.state.category === 'Both'}
              onChange={event => {
                this.setState({ category: event.target.value });
                this.updateData(event.target.value);
              }}
            />
            Overall
          </label>
        </div>
        <input type="button" onClick={() => this.updateData(this.state.category)} value="ANALYZE" />
        <Styles>
          <DefensiveTable
            columns={this.state.columns}
            data={this.state.data}
            getCellProps={cellInfo => ({
              style: {
                backgroundColor: `hsl(${(1 - cellInfo.value / (this.state.maxDamage + 0.1)) * 205}, 100%, 50%)`,
              },
            })}
          />
        </Styles>
      </div>
    );
  }
}

export default observer(DefensiveTableTool);
