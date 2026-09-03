use anchor_lang::prelude::*;
use anchor_lang::system_program;

declare_id!("FLiPduEL1111111111111111111111111111111111");

#[program]
pub mod flipduel_escrow {
    use super::*;

    pub fn create_room(
        ctx: Context<CreateRoom>,
        room_id: u64,
        bank_lamports: u64,
        duration_min: u16,
    ) -> Result<()> {
        require!(bank_lamports >= 50_000_000, FlipduelError::MinBank);
        require!(bank_lamports % 2 == 0, FlipduelError::OddBank);

        let room = &mut ctx.accounts.room;
        room.authority = ctx.accounts.authority.key();
        room.player1 = ctx.accounts.player1.key();
        room.player2 = Pubkey::default();
        room.bank_lamports = bank_lamports;
        room.stake_lamports = bank_lamports / 2;
        room.duration_min = duration_min;
        room.status = RoomStatus::Waiting;
        room.room_id = room_id;
        room.bump = ctx.bumps.room;
        room.vault_bump = ctx.bumps.vault;
        Ok(())
    }

    pub fn cancel_search(ctx: Context<CancelSearch>) -> Result<()> {
        let room = &ctx.accounts.room;
        require!(room.status == RoomStatus::Waiting, FlipduelError::InvalidStatus);
        require!(
            room.player2 == Pubkey::default(),
            FlipduelError::OpponentJoined
        );

        let vault_balance = ctx.accounts.vault.lamports();
        let stake = room.stake_lamports;
        if vault_balance >= stake {
            transfer_from_vault(
                &ctx.accounts.vault,
                &ctx.accounts.player1,
                &ctx.accounts.system_program,
                stake,
                &[&[b"vault", &room.room_id.to_le_bytes(), &[room.vault_bump]]],
            )?;
        }

        let room = &mut ctx.accounts.room;
        room.status = RoomStatus::Cancelled;
        Ok(())
    }

    pub fn settle_win(ctx: Context<SettleWin>, winner: Pubkey) -> Result<()> {
        let room = &ctx.accounts.room;
        require!(room.status == RoomStatus::Active, FlipduelError::InvalidStatus);
        require!(
            winner == room.player1 || winner == room.player2,
            FlipduelError::InvalidWinner
        );

        let vault_balance = ctx.accounts.vault.lamports();
        if vault_balance > 0 {
            transfer_from_vault(
                &ctx.accounts.vault,
                &ctx.accounts.winner,
                &ctx.accounts.system_program,
                vault_balance,
                &[&[b"vault", &room.room_id.to_le_bytes(), &[room.vault_bump]]],
            )?;
        }

        let room = &mut ctx.accounts.room;
        room.status = RoomStatus::Settled;
        Ok(())
    }

    pub fn settle_tie(ctx: Context<SettleTie>) -> Result<()> {
        let room = &ctx.accounts.room;
        require!(room.status == RoomStatus::Active, FlipduelError::InvalidStatus);

        let stake = room.stake_lamports;
        let seeds = &[&[b"vault", &room.room_id.to_le_bytes(), &[room.vault_bump]]];

        transfer_from_vault(
            &ctx.accounts.vault,
            &ctx.accounts.player1,
            &ctx.accounts.system_program,
            stake,
            seeds,
        )?;
        transfer_from_vault(
            &ctx.accounts.vault,
            &ctx.accounts.player2,
            &ctx.accounts.system_program,
            stake,
            seeds,
        )?;

        let room = &mut ctx.accounts.room;
        room.status = RoomStatus::Settled;
        Ok(())
    }

    pub fn register_player2(ctx: Context<RegisterPlayer2>) -> Result<()> {
        let room = &mut ctx.accounts.room;
        require!(room.status == RoomStatus::Waiting, FlipduelError::InvalidStatus);
        require!(room.player2 == Pubkey::default(), FlipduelError::OpponentJoined);
        room.player2 = ctx.accounts.player2.key();
        Ok(())
    }

    pub fn mark_active(ctx: Context<MarkActive>) -> Result<()> {
        let room = &mut ctx.accounts.room;
        require!(room.status == RoomStatus::Waiting, FlipduelError::InvalidStatus);
        require!(room.player2 != Pubkey::default(), FlipduelError::NoOpponent);

        let vault_balance = ctx.accounts.vault.lamports();
        require!(
            vault_balance >= room.bank_lamports,
            FlipduelError::InsufficientVault
        );

        room.status = RoomStatus::Active;
        Ok(())
    }
}

fn transfer_from_vault<'info>(
    vault: &AccountInfo<'info>,
    to: &AccountInfo<'info>,
    system_program: &AccountInfo<'info>,
    amount: u64,
    vault_seeds: &[&[u8]],
) -> Result<()> {
    system_program::transfer(
        CpiContext::new_with_signer(
            system_program.clone(),
            system_program::Transfer {
                from: vault.clone(),
                to: to.clone(),
            },
            &[vault_seeds],
        ),
        amount,
    )?;
    Ok(())
}

#[derive(Accounts)]
#[instruction(room_id: u64)]
pub struct CreateRoom<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    /// CHECK: player1 pubkey stored in room
    pub player1: AccountInfo<'info>,
    #[account(
        init,
        payer = authority,
        space = 8 + Room::INIT_SPACE,
        seeds = [b"room", room_id.to_le_bytes().as_ref()],
        bump
    )]
    pub room: Account<'info, Room>,
    /// CHECK: vault PDA holds SOL
    #[account(
        mut,
        seeds = [b"vault", room_id.to_le_bytes().as_ref()],
        bump
    )]
    pub vault: SystemAccount<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CancelSearch<'info> {
    pub authority: Signer<'info>,
    #[account(
        mut,
        has_one = authority,
        has_one = player1
    )]
    pub room: Account<'info, Room>,
  /// CHECK: player1 refund target
    #[account(mut)]
    pub player1: AccountInfo<'info>,
    #[account(
        mut,
        seeds = [b"vault", room.room_id.to_le_bytes().as_ref()],
        bump = room.vault_bump
    )]
    pub vault: SystemAccount<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SettleWin<'info> {
    pub authority: Signer<'info>,
    #[account(mut, has_one = authority)]
    pub room: Account<'info, Room>,
    /// CHECK: winner receives vault
    #[account(mut)]
    pub winner: AccountInfo<'info>,
    #[account(
        mut,
        seeds = [b"vault", room.room_id.to_le_bytes().as_ref()],
        bump = room.vault_bump
    )]
    pub vault: SystemAccount<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SettleTie<'info> {
    pub authority: Signer<'info>,
    #[account(mut, has_one = authority)]
    pub room: Account<'info, Room>,
    /// CHECK: player1 refund
    #[account(mut)]
    pub player1: AccountInfo<'info>,
    /// CHECK: player2 refund
    #[account(mut)]
    pub player2: AccountInfo<'info>,
    #[account(
        mut,
        seeds = [b"vault", room.room_id.to_le_bytes().as_ref()],
        bump = room.vault_bump
    )]
    pub vault: SystemAccount<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RegisterPlayer2<'info> {
    pub authority: Signer<'info>,
    #[account(mut, has_one = authority)]
    pub room: Account<'info, Room>,
    /// CHECK: player2 pubkey
    pub player2: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct MarkActive<'info> {
    pub authority: Signer<'info>,
    #[account(mut, has_one = authority)]
    pub room: Account<'info, Room>,
    #[account(
        mut,
        seeds = [b"vault", room.room_id.to_le_bytes().as_ref()],
        bump = room.vault_bump
    )]
    pub vault: SystemAccount<'info>,
}

#[account]
#[derive(InitSpace)]
pub struct Room {
    pub authority: Pubkey,
    pub player1: Pubkey,
    pub player2: Pubkey,
    pub bank_lamports: u64,
    pub stake_lamports: u64,
    pub duration_min: u16,
    pub status: RoomStatus,
    pub room_id: u64,
    pub bump: u8,
    pub vault_bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace)]
pub enum RoomStatus {
    Waiting,
    Active,
    Settled,
    Cancelled,
}

#[error_code]
pub enum FlipduelError {
    #[msg("Minimum bank is 0.05 SOL")]
    MinBank,
    #[msg("Bank must be even lamports for equal stakes")]
    OddBank,
    #[msg("Invalid room status")]
    InvalidStatus,
    #[msg("Opponent already joined")]
    OpponentJoined,
    #[msg("Invalid winner")]
    InvalidWinner,
    #[msg("No opponent")]
    NoOpponent,
    #[msg("Insufficient vault balance")]
    InsufficientVault,
}
