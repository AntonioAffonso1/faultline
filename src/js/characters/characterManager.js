class CharacterManager {
    static STORAGE_KEY = "faultline_characters";

    static getAll() {
        try {
            const saved = localStorage.getItem(this.STORAGE_KEY);
            const characters = saved ? JSON.parse(saved) : [];

            return Array.isArray(characters) ? characters : [];
        } catch (error) {
            console.error("Erro ao carregar personagens:", error);
            return [];
        }
    }

    static getById(id) {
        return this.getAll().find(character => character.id === id) ?? null;
    }

    static save(character) {
        const characters = this.getAll();
        const data = character.toJSON();

        const index = characters.findIndex(
            item => item.id === data.id
        );

        if (index >= 0) {
            characters[index] = data;
        } else {
            characters.push(data);
        }

        localStorage.setItem(
            this.STORAGE_KEY,
            JSON.stringify(characters)
        );

        return data;
    }

    static delete(id) {
        const characters = this.getAll().filter(
            character => character.id !== id
        );

        localStorage.setItem(
            this.STORAGE_KEY,
            JSON.stringify(characters)
        );
    }
}