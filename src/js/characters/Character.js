class Character {
    constructor(name, characterClass, attributes, id = null, appearance = null) {
        this.id = id ?? `${Date.now()}-${Math.random()}`;
        this.name = name;
        this.characterClass = characterClass;
        this.attributes = { ...attributes };
        this.energy = 100;
        this.appearance = appearance;
}


    // Retorna os bônus passivos da classe.
    getPassives() {
        const passives = {
            Combatente: { strength: 2 },
            Defensor: { resistance: 3 },
            Anômalo: { power: 3 }
        };

        return passives[this.characterClass] ?? {};
    }

    // Calcula os atributos incluindo os bônus da classe.
    getEffectiveAttributes() {
        const passive = this.getPassives();

        return {
            vitality: this.attributes.vitality,
            strength: this.attributes.strength + (passive.strength ?? 0),
            power: this.attributes.power + (passive.power ?? 0),
            resistance: this.attributes.resistance + (passive.resistance ?? 0)
        };
    }

    // Calcula a vida máxima.
    getMaxHealth() {
        return 100 + this.getEffectiveAttributes().vitality * 10;
    }

    // Calcula o dano físico.
    getPhysicalDamage() {
        return 10 + this.getEffectiveAttributes().strength * 2;
    }

    // Calcula o poder das habilidades especiais.
    getSpecialPower() {
        return 12 + this.getEffectiveAttributes().power * 2;
    }

    // Retorna os dados que serão armazenados no navegador.
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            characterClass: this.characterClass,
            attributes: this.attributes,
            energy: this.energy,
            appearance: this.appearance
        };
    }
}
